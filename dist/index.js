"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const csv_writer_1 = require("csv-writer");
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
app.use((0, cors_1.default)());
const port = process.env.PORT || 3000;
const writer = (0, csv_writer_1.createObjectCsvWriter)({
    path: path_1.default.join(__dirname, 'coffee 4.csv'),
    append: true,
    header: [
        { id: "date", title: "date" },
        { id: "datetime", title: "datetime" },
        { id: "cash_type", title: "cash_type" },
        { id: "card", title: "card" },
        { id: "sales", title: "money" },
        { id: "coffee_name", title: "coffee_name" },
    ]
});
const pythonInt = './venv/bin/python3';
app.get("/", (req, res) => {
    res.send("Express + TypeScript Server");
});
app.get("/machinelearning", (req, res) => {
    console.log('Running Python Script');
    const py = (0, child_process_1.spawn)(pythonInt, ['src/knn.py']);
    let dat = '';
    const init = new Promise(() => {
        py.stdout.on('data', (data) => {
            console.log('Data from Machine Learning');
            console.log('===================');
            console.log('String:');
            console.log(data.toString());
            dat = data.toString();
            console.log('===================');
            console.log('JSON: ');
            console.log(data.toJSON());
            console.log('===================');
        });
        py.on('close', (code) => {
            console.log(dat);
            let final = JSON.parse(dat);
            console.log('Final');
            console.log(final);
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.status(200).send(final);
        });
    });
    init.then((what) => {
        console.log('init');
        res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
        res.status(200).send({ data: what });
    });
});
app.post("/update", (req, res) => {
    console.log(req.body);
    let incomeData = req.body;
    // find out how much data to write
    let dataSet = [];
    incomeData.map((data) => {
        if (data.sales > 0) {
            for (let i = 0; i < data.sales; i++) {
                let dat = {
                    "date": new Date().toLocaleDateString(),
                    "datetime": data.time,
                    "cash_type": "card",
                    "card": "Added from web app",
                    "sales": 1,
                    "coffee_name": data.coffee_name,
                };
                dataSet.push(dat);
            }
        }
    });
    console.log(dataSet);
    // write the data into coffee
    const insertData = () => __awaiter(void 0, void 0, void 0, function* () {
        yield writer.writeRecords(dataSet);
    });
    insertData();
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).send({ data: "Passed" });
});
app.get("/reset", (req, res) => {
    const sourceFilePath = path_1.default.join(__dirname, 'coffee 4.csv'); // Path to the original CSV file
    const destinationFilePath = path_1.default.join(__dirname, 'coffee 4_copy.csv'); // Path for the copied file
    fs_1.default.copyFile(destinationFilePath, sourceFilePath, (err) => {
        if (err) {
            console.error('Error copying file:', err);
            res.status(500).send('Error copying file');
        }
        else {
            res.send('CSV file copied successfully');
        }
    });
});
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
