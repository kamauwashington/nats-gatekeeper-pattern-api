/////////////////////////////// NATS Constants ///////////////////////////////
export const RAW_MSG_SUBJECT : string = process.env.RAW_MSG_SUBJECT || "raw.message";
export const VALIDATED_SUBJECT_PREFIX : string = process.env.VALIDATED_SUBJECT_PREFIX || "validated.requests";
export const NATS_SERVER : string = process.env.NATS_SERVER || "localhost";
// a guid is used for a default as this queue will be used by the validation subscriber only
export const VALIDATION_QUEUE : string = process.env.VALIDATION_QUEUE || "81070d8c-bbe6-4416-a531-a9338fe9fa62";

/////////////////////////////// Express Server Constants ///////////////////////////////
export const HOST_PORT : number = parseInt(process.env.PORT || "3000");
export const HOST : string = process.env.HOST || "localhost";

/////////////////////////////// API Keys ///////////////////////////////
export const TOMTOM_API_KEY : string = process.env.TOMTOM_API_KEY || "no-key"

/////////////////////////////// HEADERS ///////////////////////////////
export const VALIDATION_SUCCEEDED_HEADER : string = process.env.VALIDATION_SUCCEEDED_HEADER || "X-SCHEMA-VALIDATION-SUCCEEDED";
export const JSON_SCHEMA_HEADER : string = process.env.JSON_SCHEMA_HEADER || "X-JSON-SCHEMA"
