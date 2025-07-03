require("dotenv").config(); //to load in the secret keys from .env

const CLIENT_ID = process.env.MAL_CLIENT_ID;
const CLIENT_SECRET = process.env.MAL_CLIENT_SECRET;


function onadd(){
    console.log(CLIENT_ID);
    console.log(CLIENT_SECRET);

}