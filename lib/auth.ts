import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { SiweMessage } from "siwe";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Ethereum",
      credentials: {
        address:   { label: "Address",   type: "text" },
        message:   { label: "Message",   type: "text" },
        signature: { label: "Signature", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.address || !credentials?.message || !credentials?.signature) {
          return null;
        }

        try {
          // Parse and verify the EIP-4361 SIWE message
          const siwe = new SiweMessage(credentials.message);
          const result = await siwe.verify({ signature: credentials.signature });

          if (!result.success) return null;

          // Address in the signed message must match the claimed address
          if (siwe.address.toLowerCase() !== credentials.address.toLowerCase()) {
            return null;
          }
        } catch {
          return null;
        }

        const address = credentials.address.toLowerCase();
        const user = await prisma.user.upsert({
          where:  { address },
          create: { address },
          update: {},
        });

        return { id: user.id, name: address, email: address };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.name) {
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",   // redirect unauthenticated users to landing, not /api/auth/signin
  },
  secret: process.env.NEXTAUTH_SECRET,
};
