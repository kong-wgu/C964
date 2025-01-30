import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";

import path from "path";

import {spawn} from 'child_process'
import {createObjectCsvWriter} from "csv-writer"

import bodyParser from "body-parser";
import cors from 'cors'

import fs from 'fs'

dotenv.config();

const app: Express = express();

app.use(bodyParser.json())
app.use(cors())
const port = process.env.PORT || 3000;

const writer = createObjectCsvWriter({
  path: path.join(__dirname, 'coffee 4.csv'),
  append : true,
  header: [
    { id: "date" , title: "date"},
    { id: "datetime" , title: "datetime"},
    { id: "cash_type" , title: "cash_type"},
    { id: "card" , title: "card"},
    { id: "sales", title: "money"},
    { id: "coffee_name", title: "coffee_name"},
  ] 
})

const pythonInt = './venv/bin/python3'

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.get("/machinelearning", (req: Request, res: Response) => {
  console.log('Running Python Script')
  const py = spawn(pythonInt, ['src/knn.py']);
  let dat = '';

  const init = new Promise(() => {
    py.stdout.on('data', (data : Buffer) => {
      console.log('Data from Machine Learning')
      console.log('===================')
      console.log('String:')
      console.log(data.toString())
      dat = data.toString()
      console.log('===================')

      console.log('JSON: ')
      console.log(data.toJSON())

      console.log('===================')
      
    })
  
    py.on('close', (code : any) => {
      console.log(dat)
      let final = JSON.parse(dat);
      console.log('Final')
      console.log(final)
      res.setHeader("Content-Type", "application/json")
      res.setHeader("Access-Control-Allow-Origin" , "*")
      res.status(200).send(final)
    } )

  })

  init.then((what) => {
    console.log('init')
    res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" })
    res.status(200).send({data: what})

  })
})

app.post("/update", (req: Request, res: Response) => {
  console.log(req.body)
  let incomeData = req.body;
  
  // find out how much data to write
  let dataSet : {
    "date": string,
    "datetime" : string,
    "cash_type" : string,
    "card" : string,
    "sales" : number
    "coffee_name" : string,
  }[] = []

  incomeData.map((data: { "coffee_name" : string, "hour_of_day" : number, "sales" : number, "time" : string }) => {
    if(data.sales > 0){
      for(let i = 0; i < data.sales; i ++){
        let dat = {
          "date" : new Date().toLocaleDateString(),
          "datetime" : data.time,
          "cash_type" : "card",
          "card" : "Added from web app",
          "sales" : 1,
          "coffee_name" : data.coffee_name,
        }
        dataSet.push(dat);
      }
    }
  })

  console.log(dataSet);

  // write the data into coffee
  const insertData = async() => {
    await writer.writeRecords(dataSet)
  }

  insertData();

  res.setHeader("Content-Type", "application/json")
  res.setHeader("Access-Control-Allow-Origin" , "*")
  res.status(200).send({data : "Passed"})
})

app.get("/reset", (req: Request, res: Response) => {
  const sourceFilePath = path.join(__dirname, 'coffee 4.csv'); // Path to the original CSV file
  const destinationFilePath = path.join(__dirname, 'coffee 4_copy.csv'); // Path for the copied file

  fs.copyFile(destinationFilePath, sourceFilePath, (err : any) => {
    if (err) {
      console.error('Error copying file:', err);
      res.status(500).send('Error copying file');
    }else {
      res.send('CSV file copied successfully');
    }
  });
})

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});