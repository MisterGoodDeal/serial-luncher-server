import { getRoutes } from "./services/routes";
import { webServices } from "./services/web";
import { Request, Response } from "express";
import path from "path";

const env = require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const app = express();

var favicon = require("serve-favicon");

app.use(express.static(__dirname, { dotfiles: "allow" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.raw({ limit: "50mb" }));
app.disable("etag"); // No caching
app.use((req: Request, res: Response, next: any) => {
  res.append("version", process.env.VERSION);
  res.append("Access-Control-Allow-Origin", "*");
  res.append("Access-Control-Allow-Headers", "*");
  next();
});
app.use(favicon(path.join(__dirname, "images", "favicon.ico")));

app.get("/", function (req: Request, res: Response) {
  res.status(200).json({ "serial-luncher": { version: process.env.VERSION } });
});

app.get("/cgu", function (req: Request, res: Response) {
  res.sendFile(path.join(__dirname, "cgu.html"));
});

const routes = getRoutes();
routes.forEach((route: string) => {
  import("./routes/" + route).then((r: any) => {
    r.default(app);
  });
});

webServices({ app: app, usingHttps: false, httpsDomain: "" });
