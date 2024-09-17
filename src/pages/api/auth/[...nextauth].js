
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { authConfig } from '../../../../auth.config';
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcrypt';

async function getUser(email) {
  try {
    const user = await sql`SELECT * FROM users WHERE email=${email}`;
    return user.rows[0];
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

export default NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({
            email: z.string().email(),
            password: z.string().min(6),
          })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          console.log('Invalid credentials format');
          return null;
        }

        const { email, password } = parsedCredentials.data;

        const user = await getUser(email);
        if (!user) {
          console.log('User not found');
          return null;
        }

        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (passwordsMatch) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
          };
        } else {
          console.log('Incorrect password');
          return null;
        }
      },
    }),
  ],
  // Add any additional NextAuth configurations here
});
