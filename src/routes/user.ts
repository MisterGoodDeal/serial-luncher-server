import { db } from "../db";
import { Request, Response } from "express";
import { User } from "../utils/user/interfaces";
import { userReturnCode } from "../utils/user/returnCodes";
import { returnCode } from "../utils/returnCodes";
import { generateToken } from "../utils/jwt";
import { MySQLResponse } from "../utils/interfaces";
import { pwdUtils } from "../utils/password";
import { images } from "../helpers/images.helpers";
import { auth } from "../middleware/auth";

const env = require("dotenv").config();

const user = (app: any) => {
  // Edit the user
  app.put("/user/edit", auth, async function (req: Request, res: Response) {
    const partialUser: Partial<User> = req.body;
    // @ts-ignore
    const { id } = req.user;

    const user: User[] = await db.queryParams(
      "SELECT * FROM Users WHERE id = ?",
      [id]
    );
    if (user.length === 1) {
      if (partialUser.profile_picture) {
        const imgurImage = partialUser.profile_picture
          ? await images.upload(partialUser.profile_picture)
          : { data: { link: "" } };
        partialUser.profile_picture = imgurImage.data.link;
      }

      if (partialUser.password) {
        partialUser.password = await pwdUtils.hash(partialUser.password);
      }

      // New date to format (YYYY-MM-DD HH:MM:SS)

      const token: string = generateToken({
        id: user[0].id,
        email: user[0].email,
        firstname: user[0].firstname,
        lastname: user[0].lastname,
        profile_picture: user[0].profile_picture,
      });
      partialUser.token = token;

      // @ts-ignore
      partialUser.updated_at = formattedDate();

      const query = userQueryBuilder(partialUser);
      console.log(query);

      await db.queryParams(`UPDATE Users SET ${query} WHERE id = ?`, [id]);
      const fetchedUser: User[] = await db.queryParams(
        "SELECT * FROM Users WHERE id = ?",
        [id]
      );

      res.status(200).json(fetchedUser[0]);
    } else {
      res
        .status(returnCode.unknownUser.code)
        .json(returnCode.unknownUser.payload);
    }
  });

  // Delete the user
  app.delete(
    "/user/delete",
    auth,
    async function (req: Request, res: Response) {
      // @ts-ignore
      const { id } = req.user;
      const user: User[] = await db.queryParams(
        "SELECT * FROM Users WHERE id = ?",
        [id]
      );
      if (user.length === 1) {
        // Leave group
        await db.queryParams(
          "DELETE FROM UsersLauchGroupsAssoc WHERE fk_user = ?",
          [id]
        );

        // Soft delete user
        await db.queryParams(
          "UPDATE Users SET deleted_at = ?, firstname = 'DELETED_USER', lastname = '', email = 'user@hasbeen.deleted', oauth_service_id = NULL WHERE id = ?",
          [formattedDate(), id]
        );
        res.status(200);
      } else {
        res
          .status(returnCode.unknownUser.code)
          .json(returnCode.unknownUser.payload);
      }
    }
  );
};

const userQueryBuilder = (user: Partial<User>) => {
  const query = Object.keys(user)
    .map(
      (key) =>
        `${key} = ${
          // @ts-ignore
          typeof user[key] === "string" ? `'${user[key]}'` : user[key]
        }`
    )
    .join(", ");
  return query;
};

const formattedDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export default user;
