import { FastifyInstance } from "fastify"
import { prisma } from "../lib/prisma"
import { z } from 'zod'

export async function authRoutes (fastify: FastifyInstance) {
    fastify.post('/users', async (request) =>   {
        const createUserBody = z.object({
            accessToken: z.string()
        })

        const userInfoSchema = z.object({
            id: z.string(),
            email: z.string().email(),
            name: z.string(),
            picture: z.string().url()
        })
        
        const { accessToken } = createUserBody.parse(request.body)

        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}` 
            }
        })

        const userData = await userResponse.json()

        const userInfo = userInfoSchema.parse(userData)

        console.log(userInfo)

        return { userInfo }

    })
}

