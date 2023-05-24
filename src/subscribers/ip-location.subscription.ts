import { JSONCodec, Codec, NatsError, Msg } from 'nats';
import { VALIDATED_SUBJECT_PREFIX } from '../common/constants.ts'
import { natsConnection } from '../common/connection.ts';
import { IResponse } from '../common/interfaces/response.interface.ts';
import { ResponseStatus } from '../enums/status.enum.ts';
import axios, { AxiosResponse } from 'axios';
import { IIP } from '../common/interfaces/ip.interface.ts';

// create a jsonCodec instance for decoding bytes returned from the subject into JSON
const jsonCodec : Codec<unknown> = JSONCodec();

// full subject name using prefix
const subject : string = `${VALIDATED_SUBJECT_PREFIX}.ip-geo`;

/*
 * Mmessages will be published to RAW_MSG_SUBJECT.<API_PATH_SUBJECT>, subscribe or react to all raw messages 
 * for validattion. The API_PATH_SUBJECT will be extracted and used as the next subscriber in the chain of command.
 */ 
natsConnection.subscribe(subject,{
    
    
    callback : async (err : NatsError | null, msg : Msg) => {
        // decode the raw json submitted to the subject to ICoordinates
        const ip : IIP = jsonCodec.decode(msg.data) as IIP;

        // make the reverse geocode request to IPAPI using the validated coordinate json
        try {
            const preparedUrl : string = `https://ipapi.co/${ip.ip}/json/`;
            console.log(`Requesting response from  : ${preparedUrl}`);
            const reverseGeo : AxiosResponse = await axios.get(preparedUrl);
            const rjResponse : IResponse = {
                status : ResponseStatus.SUCCESS,
                data : reverseGeo.data
            }
            // reply should be set coming in, use request-reply pattern (publish could be used as well with reply set to msg.reply)
            msg.respond(jsonCodec.encode(rjResponse));
        } catch (error) {
            const catchErrorResponse : IResponse = {
                status : ResponseStatus.ERROR,
                message : error
            }
            // this will respond to the reply subject on the msg object
            msg.respond(jsonCodec.encode(catchErrorResponse))
        }
    }
})
console.log(`Subscribed to subject '${subject}'`);


