import { ResponseStatus }  from "../../enums/status.enum.ts";

export interface IResponse {
    status : ResponseStatus
    message? : string
    data? : any
}