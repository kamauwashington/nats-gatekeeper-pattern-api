# Nats.io Gatekeeper Pattern as ExpressJS REST API

> This repository is purely for reference and is illustrative in it is purpose. Please do not use in production as is, use this as a guide
or starting point for a production level implementation.


This project illustrates the use of [Nats.io](https://nats.io/) to implement JSON schema validation using the [Gatekeeper Pattern](https://dzone.com/articles/cloud-design-patterns-part-2-the-gatekeeper-securi) via built in [Request/Reply streaming pattern](https://docs.nats.io/nats-concepts/core-nats/reqreply) within an [ExpressJS]() API. The goal behind this implementation is to showcase a loosely coupled Gatekeeper Pattern, wherein the execution of an API request is first evaluated by a validation subscriber (the **Gatekeeper**) prior to forwarding on to its intended subscriber

> What will be seen in this example are json requests sent to dynamic ExpressJS endpoints, the messages validated / invalidated before published to the next subject in the chain (if validated). The reply from two subscriptions in succession (gatekeeper and worker) will asynchronously reply to the REST API callee if validated,or the validation subscription will return validation errors to the REST API callee.

## Prerequisites

Before you continue, ensure you have met the following requirements:

* [Nats Server](https://docs.nats.io/running-a-nats-service/introduction/installation#downloading-a-release-build) or [Nats Docker Server](https://hub.docker.com/_/nats) installed and running
    * If installing the Go Server, [Go](https://go.dev/doc/install) must be installed
* NodeJS v18 or higher installed
* Npm installed
* Get a free [TomTom API](https://developer.tomtom.com/user/register?destination=/how-to-get-tomtom-api-key) key!
    * this is needed to get valid results from the *reverse-geocode.subscription*

## Environment Variables

This repository uses dotenv, feel free to create a .env to override other aspects of the program.

* TOMTOM_API_KEY : The API Key provided by TomTom (defaults to **no-key**)
* HOST : The host the express server should run on (defaults to **localhost**)
* HOST_PORT : The port the express server should run on (defaults to **3000**)
* RAW_MSG_SUBJECT : The Nats subject all Requests will be published to (defaults to **raw.message**)
* VALIDATED_SUBJECT_PREFIX : The Nats subject prefix for all validated messages (defaults to **validated.requests**)
    * if a message is validated, and was received @ http://host/port/incomming/ip-geo, the subject will be **validated.requests.ip-geo**
* VALIDATION_QUEUE : The name of the Queue Group for the validation subscribers (defaults to **81070d8c-bbe6-4416-a531-a9338fe9fa62**)
* NATS_SERVER : The Nats server that will be facilitating Pub-Sub (defaults to  **localhost**)
* VALIDATION_SUCCEEDED_HEADER : Nats message header for validation success (defaults to **X-SCHEMA-VALIDATION-SUCCEEDED**)
* JSON_SCHEMA_HEADER : Nats message header containing the location and name of the JSON schema used for validation (defaults to **JSON_SCHEMA_HEADER**)

## Running the Application

1) 'cd' to the root of this repository (where it was cloned)
1) Create a file in the root named **.env**
    * Add the TomTom key in this file as follows : **TOMTOM_API_KEY**=< insert key here >**
1) run **npm install** from the command line
1) open a terminal to the root of this repository and run :
    * **npm run validator**
    * _allow the subscription a few additional seconds to bind, 503 errors may be experienced during this binding time_
1) open a terminal to the root of this repository and run :
    * **npm run ip-geo**
    * _allow the subscription a few additional seconds to bind, 503 errors may be experienced during this binding time_
1) open an additional terminal to the root of this repository and run :
    * **npm run reverse-geo**
    * _allow the subscription a few additional seconds to bind, 503 errors may be experienced during this binding time_
1) open an additional to the root of this repository and run :
    * **npm run api**

## Lets try some requests!
This API will only accept POSTS via HTTP, keep this in mind if you run into errors when posting. A POST, even if failing validation will return a status code of 200.

> Mangle with the request body to observe validation in action!

### Example #1 IP base Reverse GEO Location using IPAPI

* POST the following to "http://localhost:3000/incomming/ip-geo"

    ```json
        {
            "ip" : "8.8.8.8"
        }
    ```
* Response
    ```json
    {
        "status": "SUCCESS",
        "data": {
            "ip": "8.8.8.8",
            "network": "8.8.8.0/24",
            "version": "IPv4",
            "city": "Mountain View",
            "region": "California",
            "region_code": "CA",
            "country": "US",
            "country_name": "United States",
            "country_code": "US",
            "country_code_iso3": "USA",
            "country_capital": "Washington",
            "country_tld": ".us",
            "continent_code": "NA",
            "in_eu": false,
            "postal": "94043",
            "latitude": 37.42301,
            "longitude": -122.083352,
            "timezone": "America/Los_Angeles",
            "utc_offset": "-0700",
            "country_calling_code": "+1",
            "currency": "USD",
            "currency_name": "Dollar",
            "languages": "en-US,es-US,haw,fr",
            "country_area": 9629091,
            "country_population": 327167434,
            "asn": "AS15169",
            "org": "GOOGLE"
        }
    }
    ```

### Example #2 TomTom Reverse Address lookup using coordinates

* POST the following to "http://localhost:3000/incomming/reverse-geo"

    ```json
    {
        "latitude" : 34.0713614,
        "longitude" : -84.2767148
    }
    ```
* Response
    ```json
    {
        "status": "SUCCESS",
        "data": {
            "summary": {
                "queryTime": 15,
                "numResults": 1
            },
            "addresses": [
                {
                    "address": {
                        "routeNumbers": [],
                        "street": "3rd Street",
                        "streetName": "3rd Street",
                        "countryCode": "US",
                        "countrySubdivision": "GA",
                        "countrySecondarySubdivision": "Fulton",
                        "municipality": "Alpharetta",
                        "postalCode": "30009",
                        "country": "United States",
                        "countryCodeISO3": "USA",
                        "freeformAddress": "3rd Street, Alpharetta, GA 30009",
                        "boundingBox": {
                            "northEast": "34.071513,-84.277164",
                            "southWest": "34.071308,-84.277772",
                            "entity": "position"
                        },
                        "extendedPostalCode": "30009-2206",
                        "countrySubdivisionName": "Georgia",
                        "localName": "Alpharetta"
                    },
                    "position": "34.071396,-84.277161"
                }
            ]
        }
    }
    ```



## Notes
* Notice that the API has no prior knowledge as to what the subscriber is going to provide
* Validation can be put in place or a canonical can be used to ensure correctness of the reply
* This repository is heavily commented to provide context as to what and why, if in VS Code feel free to collapse all comments if they are obtrusive
    * On Mac -> Press <kbd>&#8984;</kbd> + <kbd>K</kbd> then <kbd>&#8984;</kbd> + <kbd>/</kbd> 
    * On Windows & Linux -> Press <kbd>Ctrl</kbd> + <kbd>K</kbd> then <kbd>Ctrl</kbd> + <kbd>/</kbd> 