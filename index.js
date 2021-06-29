/*
 * NAS BackEnd Assignment
 * This program mainly use two modules : express and dotenv
 * There are five global variables 
 *          aSlot -> for store the available slots
 *          vehicals -> for store vehical details
 *          ip -> for store IP addresses
 *          history -> for store early parked vehical details
 *          totalSlot -> for store the total available slots
*/

const express = require("express");
require("dotenv/config");
const app = express();

//use express.JSON for handle the JSON request
app.use(express.json());

let aSlot = {}; // available slots
let vehicals = {}; // available vehicals
let ip = {}; // store the cliets IP
let history = {}; // store the early parked vehical details
const totalSlot = parseInt(process.env.SLOT); // store the available slots

//handle the user input JSON error
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).send({ status: 0, msg: "Bad Request" }); // Bad request
    }
    next();
});

/*
 * this code receive the get request /park then return the parking slot if available
 * fist check the IP traffic 
 * then check the slots are available
 * then chekc the parameters are correct
 * then check the vehical already in the park
 * then check the available slot and send to the client
 */
app.post('/park', (req, res) => {
    //get client IP
    const _ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const result = checkIP(_ip);//check the IP traffic
    if (!result) return (res.status(429).send({ status: 0, msg: "Too Many Requests" }));  // send the error for too much requests

    if (Object.keys(aSlot).length >= process.env.SLOT) return (res.status(201).send({ status: 0, msg: "All slots are fully loaded" }));

    const vehicalNumber = req.body.vehical_no;//get vehical number
    const name = req.body.name;//get the driver name

    //check vehical number and name is set and valid if not return the bad request error
    if (vehicalNumber == undefined || name == undefined || vehicalNumber.length == 0 || vehicalNumber == 0) {
        return res.status(400).send({ status: 0, msg: "Bad Request" });
    }

    //check vehical already in the park
    /**
     * the vehicals object key is generate with the vehical number and the slot ID separate with the | symbol
     *  if vehical number is jk-12 and slot number is 1 then key value is 'jk-12|1' 
     * get the vehicals all keys and split with | symbol and check
     */
    const activeSlot = Object.keys(vehicals);
    for (let _lot of activeSlot) {
        if (_lot.split("|")[0] == vehicalNumber) {
            return (res.status(409).send({ status: 0, msg: "already exists" }));
        }
    }

    /*
    * check the available slot and send that slot id
    * store the slot ID, requested time and drivers name in the vehicals object
    */
    for (slotFounder = 1; slotFounder < process.env.SLOT + 1; slotFounder++) {
        if (aSlot[slotFounder] == undefined) {
            vehicals[vehicalNumber + '|' + slotFounder] = [name, Date.now()]; //creating key value and pass the data to it
            aSlot[slotFounder] = vehicalNumber + "|" + slotFounder;

            return (res.status(201).send(
                { status: 1, msg: "done", slot_no: slotFounder, available: process.env.SLOT - Object.keys(aSlot).length }
            ));
        }
    }

});

/*
 * this code block validate the input and send the unpark status to client
 * check client sent tocken id with the aSlot obejct keys. available slot keys contains the vehical park slot ID
 * if slot tocken is not in the aSlot object then retuen the bad request to the client
 * found the correct ID then add data to the history object
 * then delete the data from vehical object and slot object 
 * finaly send the success status to client with the vehical parked time 
 */
app.delete('/unpark', (req, res) => {
    //get client IP
    const _ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const result = checkIP(_ip);//check the IP traffic
    if (!result) return (res.status(429).send({ status: 0, msg: "Too Many Requests" })); // send the error for too much requests
    const slotToken = req.body.slot_no;//get lot nomber

    if (aSlot[slotToken] == undefined) {
        return (res.status(400).send({ status: 0, msg: "bad request" }));
    }

    //add data to history object
    if (history[slotToken] == undefined) {
        history[slotToken] = [];
        history[slotToken].push([vehicals[aSlot[slotToken]][0], aSlot[slotToken].split("|")[0], vehicals[aSlot[slotToken]][1], Date.now()]);
    } else {
        history[slotToken].push([vehicals[aSlot[slotToken]][0], aSlot[slotToken].split("|")[0], vehicals[aSlot[slotToken]][1], Date.now()]);
    }

    //get time , delete object data and send the result to the clients
    const parkTime = vehicals[aSlot[slotToken]][1];
    delete vehicals[aSlot[slotToken]];
    delete aSlot[slotToken];
    return (res.status(202).send({ status: 1, msg: "accepted", parkTime: new Date(parkTime) }));
});

/**
 * get slot info using slot id or vehical number
 * if client send slotid then check with the aSlot object and if founded then send the result to client
 * if client send the vehicalid then check with the vehicals object keys and matched data send as the result
 */
app.get('/slotinfo/:type/:id', (req, res) => {
    //get client IP
    const _ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const result = checkIP(_ip);//check the IP traffic
    if (!result) return (res.status(429).send({ status: 0, msg: "Too Many Requests" })); // send the error for too much requests

    //get slot it for search
    if (req.params.type == "slotid") {
        //vaidate the slot id
        if (req.params.id > totalSlot || req.params.id <= 0 || isNaN(parseInt(req.params.id))) {
            return res.status(400).send({ status: 0, msg: "bad request" });
        }
        //no vehical
        if (aSlot[req.params.id] == undefined) { 
            return res.status(404).send({ status: 0, msg: "No vehical in this slot slot ID " + req.params.id }); 
        }

        const vehicalData =[vehicals[[aSlot[req.params.id]]][0] ,vehicals[[aSlot[req.params.id]]][1], aSlot[req.params.id].split("|")[0], req.params.id]; 
        return (res.status(200).send({ status: 1, msg: "founded", data: vehicalData }));
        
    }
    //request using vehicalID 
    //get all entries of vehicals object and get the maching and send result  to client
    if (req.params.type == "vehicalid") {
        for (const [key, value] of Object.entries(vehicals)) {
            if (key.split("|")[0] == req.params.id) {
                const vehicalData = [ value[0], value[1], key.split("|")[0], key.split("|")[1] ];
                return (res.status(200).send({
                    status: 1, msg: "founded",
                    data: vehicalData
                }));
            }
        }
        //cant find vehical
        return res.status(404).send({ status: 0, msg: "No vehical contains that vehical number. Vehical no : " + req.params.id });
    }
})
/**
 * get the history of the all slots or clear the history
 */
app.get('/history/:method', (req, res) => {
    //get client IP
    const _ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const result = checkIP(_ip);//check the IP traffic
    if (!result) return (res.status(429).send({ status: 0, msg: "Too Many Requests" }));  // send the error for too much requests
    
    if (req.params.method == "all") {
        return (res.status(200).send({ status: 1, msg: "founded", data: history }));
    }
    //clear the history and send the OK to client
    if (req.params.method == "clear") {
        history = {};
        return (res.status(200).send({ status: 1, msg: "Done" }));
    }
    return (res.status(400).send({ status: 0, msg: "bad request" }));
});
/**
 * send client to all slots and vehicals details
 * 
 */
app.get('/status', (req, res) => {
    //get client IP
    const _ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const result = checkIP(_ip);//check the IP traffic
    if (!result) return (res.status(429).send({ status: 0, msg: "Too Many Requests" }));  // send the error for too much requests

    return (res.status(200).send({ status: 1, msg: "found", data: { used: Object.keys(aSlot).length, vehicals: vehicals } }));
});
/**
 * avoid the bad request from get method
 */
 app.get('*', (req, res) => {
    return (res.status(400).send({ status: 0, msg: "bad request" }));
});
/**
 * avoid the bad post requests form post method
 */
app.post('*', (req, res) => {
    return (res.status(400).send({ status: 0, msg: "bad request" }));
});

/**
 * get the client IP address and count the maximum traffic and block the bad traffics
 */
function checkIP(_ip) {
    if (ip[_ip] == undefined) { //check IP have our list
        ip[_ip] = [Date.now()]; //add ip to list
        return true;
    } else {
        // ip traffic <10 and time gap below  given time
        if ((ip[_ip].length < parseInt(process.env.MAX_TRAFFIC)) && (ip[_ip][0] + parseInt(process.env.RATE_LIMIT) > Date.now())) {
            ip[_ip].push(Date.now());// add new time to slot
            return true;
        }
        // ip traffic 10> and time gap below given time
        if ((ip[_ip].length >= parseInt(process.env.MAX_TRAFFIC)) && (ip[_ip][0] + parseInt(process.env.RATE_LIMIT) > Date.now())) {
            return false;
        }
        // traffic after given traffic time
        if (ip[_ip][0] + parseInt(process.env.RATE_LIMIT) < Date.now()) {
            ip[_ip] = [Date.now()];
            return true;
        }
    }
}
/**
 * always run 5s to 5s
 * check the IP last traffic and add 20 sec to it if there are no traffic with it delete that ip
 */
async function clearIP () { 
    for (const [key, value] of Object.entries(ip)) {
        if (value[value.length-1]+ 20000 < Date.now() ) {
            delete ip[key];
        }
    }
    setTimeout(() =>{
        clearIP()
    },5000);
}

app.listen(process.env.PORT, (err) => {
    if (err) {
        return app.close(() => {
            console.log("Error server stoped " + error.message);
        })
    }
    console.log("Server is listning on port " + process.env.PORT)
    clearIP();
}
);