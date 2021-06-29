# NAS Assingnment

## Vehical Parking System

This is the source code for vehical parking system. This program starting point is index.js. 

### Installation

1. Afeter extraxtion, if neeed install express and dotenv modules.

```bash
    npm install express
    npm install dotenv
```

2. Start the server using this command

```bash
    node index.js
```

# API and the env Variables

## env file

 This env file contains four variables. Here the explanation.

    PORT - This variable use for the store the server running port. (Now use port 8080)

    SLOT - This contains the how much slots are available in our car park.

    RATE_LIMIT - This contains how much time gap need to    track the a single IP address traffic rate-limit. This contains time in miliseconds. As an example, if we want to limit no morethan 10 requests between 10 seconds then the variable value needs to be 10000 (tenthousand).

    MAX_TRAFFIC - This contains how much max traffic is valid is given time. As an example If we want to limit no morethan 10 request in given time this value must be 10.

# API

In this software we use ```GET```, ```POST``` and ```DELETE``` HTTP methods to handle the user requests.

# 1   Handle the new vehical admiting.

    POST /park
    {
        "vehical_no" : "vehical number plate number goes here",
        "name"  : "driver or trustee name"
    }

send the vehical number and driver or trustee name to the server. Response will be look like below if there are no errors. HTTP response code is 201.

    {
        "status": 1,
        "msg": "done",
        "slot_no": Here contains the slot number in interger,
        "available": available slots in interger
    }

```status: 1``` meaning success the request.

 ```msg contains``` the message from the server.

 ```slot_no``` contains the parking slot id

 ```available``` contains how much slots are available

 if the request contains the error server response will be,

1. If contains same vehical number that already in the park. HTTP response code is 409.

        {
            "status": 0,
            "msg": "already exists"
        }
2. If there are lot of traffic receive, then shows the rate-limit exceeded error. It looks like below. HTTP response code is 429.

        {
            "status": 0,
            "msg": "Too Many Requests"
        }
3. If there is missing required variable (vehical number or driver name) this error will shows. HTTP response code is 400.

        {
            "status": 0,
            "msg": "Bad Request"
        }
4. If all slots are full then server will send this error. HTTP response code is 201

        {
            status: 0, 
            msg: "All slots are fully loaded" 
        }

# 2 Handle the unparking

    DELETE /unpark
    {
        "slot_no": here use the slot number in interger
    }
needs to send ```"slot_no"``` key with the slot ID. If there are no erros, server will send this response. HTTP response code is 202.

    {
        "status": 1,
        "msg": "accepted",
        "parkTime": "Here contains the parked time of the vehical"
    }

```parkTime``` contains that time vehical slot ID issued time.

if the request contains the error server response will be,

1. If slot id does not contains any vehical it will show. HTTP response code is 400.

        {
            "status": 0,
            "msg": "bad request"
        }

2. If there are lot of traffic receive, then shows the rate-limit exceeded error. It looks like below. HTTP response code is 429.

        {
            "status": 0,
            "msg": "Too Many Requests"
        }
3. If there is missing required variable (slot_no) this error will shows. HTTP response code is 400.

        {
            "status": 0,
            "msg": "Bad Request"
        }

# 3 Handle the Slot information request

In this we can use two methods. Fist is send the GET request to server with the slot ID. The second method is GET request to server with the vehical ID. First we look at the GET request with the slot ID. Request be like this.

    GET /slotinfo/slotid/ here goes to slot id in interger

after the ```/slotinfo/slotid/``` needs to add the slot ID.

Ex :-

    GET /slotinfo/slotid/1

If all data that sends to the server is correct, server will send reply like this. HTTP response code is 200.

    {
        "status": 1,
        "msg": "founded",
        "data": [
            "driver name or trustee name here",
            parked time in here in miliseconds,
            "vehical number goes here",
            "vehical slot contains here"
        ]
    }

As the example assume driver name is **wisnshaftler** and time is **Sat May 01 2021 12:13:29** and vehical number is **jk-2** and slot id is **1**. It will looks like,

    {
        "status": 1,
        "msg": "founded",
        "data": [
            "wisnshaftler",
            1619871209241,
            "jk-2",
            "1"
        ]
    }
**data** contains the driver or trustee name, parked time, vehical number and the vehical slot number in array. 

Second method is using the vehical number. The request look like this

    GET /slotinfo/vehicalid/ here goes the vehical ID

As the example think vehical number is **jk-2**. Then requst look likes,

    GET /slotinfo/vehicalid/jk-2

If all data that sends to the server is correct, server will send reply like this. HTTP response code is 200.

    {
        "status": 1,
        "msg": "founded",
        "data": [
            "driver name or trustee name here",
            parked time in here in miliseconds,
            "vehical number goes here",
            "vehical slot contains here"
        ]
    }

**All the response architecture same to the method 1**

if the request contains the error server response will be,

1. If not pass the slotid it will generate this type of error. HTTP response code is 400 (if client send without the vehical id its generate this error)

        {
            "status": 0,
            "msg": "bad request"
        }

2. If the send empty slot id sever will send this type of error. HTTP response code is 404.

        {
            "status": 0,
            "msg": "No vehical in this slot slot ID 'vehical slot ID'"
        }

3. If there are lot of traffic receive, then shows the rate-limit exceeded error. It looks like below. HTTP response code is 429.

        ​{
            ​"status": 0,
            ​"msg": "Too Many Requests"
        ​}

4. if send the vehical id that not in the park at now it will generate this type of error. HTTP response code is 404

        {
            "status": 0,
            "msg": "No vehical contains that vehical number. Vehical no : here is vehical number"
        }

# 4 Request vehical history

When the vehical is leaving the park, the active park listening service remove the vehicals from there list. For details of all departed vehicles you can use this API call.

    GET /history/all

Response will be like this,

    {
    "status": 1,
    "msg": "founded",
    "data": {
        "slot ID": [
            [
                "driver name",
                "vehical ID",
                enterd time,
                departure time
            ]
        ]
    }

as for the example

    {
    "status": 1,
    "msg": "founded",
    "data": {
        "1": [
            [
                "wisnshaftler",
                "jk-q5454",
                1619876905444,
                1619876908761
            ]
        ]
    }

as for the example ( a single slot contains lot of vehicals)

    {
        "status": 1,
        "msg": "founded",
        "data": {
            "1": [
                [
                    "wisnshaftler",
                    "jk-q5454",
                    1619876905444,
                    1619876908761
                ],
                [
                    "wisnshaftler",
                    "jk-q5454",
                    1619876910826,
                    1619876912684
                ],
                [
                    "wisnshaftler",
                    "jk-q5454",
                    1619877053624,
                    1619877056475
                ]
            ]
        }
    }

This data store in the server RAM. If the data increase, the RAM usage get high. To handle that, we can clear the history from the RAM. To do that use this API request. HTTP response code is 200.

    GET /history/clear

server will response like this

    {
        "status": 1,
        "msg": "Done"
    }

If the request contains the error server response will be like below. HTTP response code is 400.

    {
        "status": 0,
        "msg": "bad request"
    }

If there are lot of traffic receive, then shows the rate-limit exceeded error. It looks like below. HTTP response code is 429.

        ​{
            ​"status": 0,
            ​"msg": "Too Many Requests"
        ​}

# 4 Request current status

To check current status of the vehical park we can use this. This will return HTTP response code 200 and number of used slots and vehical details

    GET /status

The respons will be,

    {
        "status": 1,
        "msg": "found",
        "data": {
            "used": slot count,
            "vehicals": {
                "vehical number| slot id": [
                    "driver name",
                    time in MS
                ]
            }
        }
    }

as for the example,

    {
        "status": 1,
        "msg": "found",
        "data": {
            "used": 1,
            "vehicals": {
                "jk-q5454|1": [
                    "wisnshaftler",
                    1619878342584
                ]
            }
        }
    }

**used** key will show you how much slots are using now. **vehicals** show you what are the vehicals in the park. The vehical Object keys are made by combining vehical ID and slot ID. It separate by **|** symbol. 

if this request does not contains the required **status** word properly, this error will show you. HTTP response is 400.

    {
        "status": 0,
        "msg": "bad request"
    }

If there are lot of traffic receive, then shows the rate-limit exceeded error. It looks like below. HTTP response code is 429.

        ​{
            ​"status": 0,
            ​"msg": "Too Many Requests"
        ​}

All the other not valid requests are thow by sendind error message like this

    {
        "status": 0,
        "msg": "bad request"
    }

# *Thats All. Happy parking!!!*
