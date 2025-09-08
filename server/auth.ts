import { betterAuth } from "better-auth";
import { expressAdapter } from "@better-auth/express";

export const auth = betterAuth({
  providers: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});

export const authRouter = expressAdapter(auth);
