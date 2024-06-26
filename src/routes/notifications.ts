import { db } from "../db";
import { Request, Response } from "express";
import { returnCode } from "../utils/returnCodes";
import { JWTProps, MySQLResponse } from "../utils/interfaces";
import { images } from "../helpers/images.helpers";
import { auth } from "../middleware/auth";
import { groupReturnCode } from "../utils/groups/returnCodes";
import { generateGroupKey } from "../utils/groups/utils";
import {
  Group,
  GroupInfo,
  UserGroupAssociation,
} from "../utils/groups/interfaces";
import { User } from "../utils/user/interfaces";
import { Place } from "../utils/places/interfaces";
import { NotificationDb } from "../utils/notifications/interfaces";

const env = require("dotenv").config();

const notifications = (app: any) => {
  // Route to add token to database
  app.post(
    "/notifications/token",
    auth,
    async (req: Request, res: Response) => {
      const { token, platform, lang } = req.body;
      // @ts-ignore
      const user: JWTProps = req.user;
      if (!token || !platform || !lang) {
        res
          .status(returnCode.missingParameters.code)
          .json(returnCode.missingParameters.payload);
      }
      try {
        // Check if token already exists
        const tokenDb: NotificationDb[] = await db.queryParams(
          "SELECT * FROM Notifications WHERE token = ? AND user = ?",
          [token, user.id]
        );
        if (tokenDb.length > 0) {
          res.status(200).json({ added: false, alreadyExists: true });
        } else {
          const response: MySQLResponse = await db.queryParams(
            "INSERT INTO Notifications (token, platform, user, lang) VALUES (?, ?, ?, ?)",
            [token, platform, user.id, lang]
          );
          if (response.affectedRows === 1) {
            res.status(201).json({ added: true, alreadyExists: false });
          } else {
            res
              .status(returnCode.internalError.code)
              .json([returnCode.internalError.payload, response]);
          }
        }
      } catch (error) {
        console.log(error);
        res.status(returnCode.internalError.code).json(error);
      }
    }
  );

  // Delete all tokens for a user
  app.delete(
    "/notifications/token",
    auth,
    async (req: Request, res: Response) => {
      // @ts-ignore
      const user: JWTProps = req.user;
      try {
        const response: MySQLResponse = await db.queryParams(
          "DELETE FROM Notifications WHERE user = ?",
          [user.id]
        );
        if (response.affectedRows >= 1) {
          res.status(200);
        } else {
          res
            .status(returnCode.internalError.code)
            .json(returnCode.internalError.payload);
        }
      } catch (error) {
        console.log(error);
        res
          .status(returnCode.internalError.code)
          .json(returnCode.internalError.payload);
      }
    }
  );
};

export default notifications;
