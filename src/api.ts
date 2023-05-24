import { default as express, Application, Request, Response } from 'express';
import { JSONCodec, Codec, Msg } from 'nats';
import { HOST_PORT, HOST, RAW_MSG_SUBJECT } from './common/constants.ts';
import { ResponseStatus } from "./enums/status.enum.ts"
import { natsConnection } from './common/connection.ts';
import { IResponse } from './common/interfaces/response.interface.ts';



// create the express application (this is the server)
const app: Application = express();
// JSON middleware
app.use(express.json());

// create a jsonCodec instance for decoding bytes returned from the subject into JSON
const jsonCodec : Codec<unknown> = JSONCodec();




// create an async post function that takes "subject" as a query parameter
app.post('/incomming/:subject', async (request: Request, response: Response): Promise<void> => {
    
   

    // validate that a subject is supplied prior to submitting a request to Nats
    if (request.params && request.params.subject) {     
        
    
        // assume that the validationsubscriber filtering using .*
        const subject : string = `${RAW_MSG_SUBJECT}.${request.params.subject}`;        
        // async call to helper method "request"
        natsConnection.request(subject,jsonCodec.encode(request.body), {
            // we want to timeout after 1.5s
            timeout : 1500
        }).then((reply : Msg)=> {
            response.json(jsonCodec.decode(reply.data));
        }).catch((reason)=> {
            
            const errorResponse : IResponse = {
                status : ResponseStatus.ERROR
            }
            if (reason.code && reason.code == 503) {
                // Nats returns a 503 if a subject is unavialble or does not have any subscribers
                errorResponse.message = `The Nats Subject "${subject}" is unavailable or does not have any subscribers attached.`;
            } else {
                // send raw error if other than 503, this can be expanded to catch other codes as well
                errorResponse.message = reason; 
            }
            response.json(errorResponse);
        })
        
        
    } else {
        const errorResponse : IResponse = {
            status : ResponseStatus.ERROR,
            message : `A subject must be supplied in the request path`
        }
        response.json(errorResponse);
    }
    
});

app.listen(HOST_PORT, HOST, (): void => {
    console.log(`Express Server is listening at : http://${HOST}:${HOST_PORT}`);
});


