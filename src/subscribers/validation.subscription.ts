import { JSONCodec, Codec, NatsError, Msg, MsgHdrs, MsgHdrsImpl } from 'nats';
import { JSON_SCHEMA_HEADER, RAW_MSG_SUBJECT, VALIDATED_SUBJECT_PREFIX, VALIDATION_SUCCEEDED_HEADER } from '../common/constants.ts'
import { natsConnection } from '../common/connection.ts';
import { IResponse } from '../common/interfaces/response.interface.ts';
import { ResponseStatus } from '../enums/status.enum.ts';
import { extractSubjectTokens } from '../common/functions/extract-subject-tokens.ts';
import registry from "../common/schema-registry.json" assert { type : "json" }
import path from 'path';
import Ajv, { ValidateFunction } from "ajv";



// create a jsonCodec instance for decoding bytes returned from the subject into JSON
const jsonCodec : Codec<unknown> = JSONCodec();

const ajv : Ajv = new Ajv();
/*
 * Mmessages will be published to RAW_MSG_SUBJECT.<API_PATH_SUBJECT>, subscribe or react to all raw messages 
 * for validattion. The API_PATH_SUBJECT will be extracted and used as the next subscriber in the chain.
 */ 
natsConnection.subscribe(`${RAW_MSG_SUBJECT}.>`,{
    
    // this guid is hardcoded as 
    queue : "81070d8c-bbe6-4416-a531-a9338fe9fa62",
    callback : async (err : NatsError | null, msg : Msg) => {

        // decode the raw json submitted to the subject
        const jsonMsg : any = jsonCodec.decode(msg.data);



        /////////////////////////////// TOKEN EXTRACTION ///////////////////////////////

        // extract all tokens separated by NATS delimiter : "."
        const tokens : string[] = extractSubjectTokens(msg.subject);

        // code defensively if we don't have tokens for some reason, reply to the requestor with an error
        if (!tokens) {
            const noTokenResponse : IResponse = {
                status : ResponseStatus.ERROR,
                message : `A valid subject tail token could not be extracted`
            }
            // this will respond to the reply subject on the msg object
            msg.respond(jsonCodec.encode(noTokenResponse),)
            // exit this callback
            return;
        } 

        // get the tail token from the msg subject using the above tokens collection
        const extractedToken : string = tokens[tokens.length - 1];

        // we want to trace some information to the next subscriber in the chain, we will add information to the header
        const msgHdrs : MsgHdrsImpl = new MsgHdrsImpl();

        /////////////////////////////// SCHEMA REGISTRY SIMULATION ///////////////////////////////

        // we are going to SIMULATE a possible call to a registry for validation against JSON schemas
        let isValid : boolean = true;
        for (let token in registry) {
            if (token == extractedToken) {

                //dynamically import from the registry when a match is found (EXPERIMENTAL)
                const schema : any = await import(path.resolve(registry[extractedToken]), {assert : {type : "json"}}); 

                //add the schema location to the header (purely for optionality in the chain)
                msgHdrs.set(JSON_SCHEMA_HEADER,registry[extractedToken])

                // in production these compiled validations should be stored in a Map if possible to cache compiled validatiors
                // NOTE, .default is used as dynamic imports add the schema to an object property named .default
                const validate : ValidateFunction<unknown> = ajv.compile(schema.default);
                const result : boolean = validate(jsonMsg);

                if (!result) {
                    const error : IResponse = {
                        status : ResponseStatus.ERROR,
                        data : validate.errors
                    };
                    // ensure to JSON encode the error message when responding to the reply subject
                    // this can be error trapped as well as .respond return boolean
                    msg.respond(jsonCodec.encode(error));
                    // this return is important as msg.respond does not "return", it one-way publishes and moves on
                    return;
                } 
            }
        }


        /////////////////////////////// POST VALIDATION ///////////////////////////////

        // construct the next subject in the chain
        const nextSubjectInChain : string = `${VALIDATED_SUBJECT_PREFIX}.${extractedToken}`;

        
        try {
            console.log(`Attempting to publish to subject '${nextSubjectInChain}.`)
            // json schema validation has succeeded, this is a sanity check for the next in chain subscriber
            msgHdrs.set(VALIDATION_SUCCEEDED_HEADER,"true");
            /* 
             * IMPORTANT!!!
             *
             * PUBLISH to the next subject in the chain instead of responding, passing along the reply subject for request-reply.
             * Publishing allows this subscriber to behave as a Proxy vs a reply subscriber.
             */ 
            natsConnection.publish(nextSubjectInChain,msg.data, {
                // note that the reply from the inbound message is proxied to the next subject in the chain
                reply : msg.reply,
                headers : msgHdrs
            })
            console.log(`Message from '${msg.subject}' has been published to '${nextSubjectInChain}\n`);
        } catch (error) {
            console.error(`Publish to subject '${nextSubjectInChain} failed due to : \n${error}`);
            const catchErrorResponse : IResponse = {
                status : ResponseStatus.ERROR,
                message : error
            };
            // this will respond to the reply subject on the msg object
            msg.respond(jsonCodec.encode(catchErrorResponse))
        }
    }
})

