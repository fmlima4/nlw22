import { FastifyInstance } from "fastify"
import { prisma } from "../lib/prisma"
import { z } from 'zod'
import ShortUniqueId from "short-unique-id"
import { authenticate } from "../plugins/authenticate"

export async function poolRoutes (fastify: FastifyInstance) {
    fastify.get('/pools/count', async () =>   {
        const count = await prisma.pool.count()
    
        return { count }
    })

    fastify.post('/pools', async (request, reply) => {
        const createPoolBody = z.object({
            title: z.string(),
        })
        
        const { title } = createPoolBody.parse(request.body)
        const generateCode = new ShortUniqueId({ length: 6 })
        const code = String(generateCode()).toUpperCase()

        try {
            await request.jwtVerify()
            await prisma.pool.create({
                data: {
                    title,
                    code: code,
                    ownerId: request.user.sub,

                    participants: {
                        create: {
                            userId: request.user.sub
                        }
                    }
                }
            })
        } catch (error) {
            await prisma.pool.create({
                data: {
                    title,
                    code: code
                }
            })
        }

        return reply.status(201).send({ code })
    })

    fastify.post('/pools/join', {
        onRequest: [authenticate],
    }, async (request, reply) => {
        const joinPoolBody = z.object({
            code: z.string(),
        })

        const { code } = joinPoolBody.parse(request.body)

        const pool = await prisma.pool.findFirst({
            where: {
                code,
            },

            include: {
                participants: {
                    where: {
                        userId: request.user.sub,
                    }
                }
            }
        })

        if (!pool) {
            return reply.status(400).send({message: 'poll not found'})
        }

        if(pool.participants.length > 0){
            return reply.status(400).send({message: 'you already joined this poll'})
        }

        if (!pool.ownerId) {
            await prisma.pool.update({
                where: {
                    id: pool.id
                },
                data:{
                    ownerId: request.user.sub
                }
            })
        }

        await prisma.participant.create({
            data: {
                poolId: pool.id,
                userId: request.user.sub
            }
        })

        return reply.status(201).send({message: 'successfull joined to the poll'})
    })


    fastify.get('/pools', {
        onRequest: [authenticate],
    }, async (request) => { 
        const pools = await prisma.pool.findMany({
            where: {
                participants: {
                    some: {
                        userId: request.user.sub
                    }
                }
            },
            include: {
                _count: {
                    select: {
                        participants: true
                    }
                },
                owner: true,
                participants: {
                    select: {
                        id: true,

                        user: {
                            select: {
                                avatarUrl: true,
                            }
                        }
                    },
                    take: 4
                }
            }
        })

        return { pools }
    })

    fastify.get('/pools/:id', {
        onRequest: [authenticate],
    }, async (request) => { 
        const getPoolParameters = z.object({
            id: z.string()
        })

        const { id } = getPoolParameters.parse(request.params)

        const pool = await prisma.pool.findUnique({
            where: {
                id,
            },
            include: {
                _count: {
                    select: {
                        participants: true
                    }
                },
                owner: true,
                participants: {
                    select: {
                        id: true,

                        user: {
                            select: {
                                avatarUrl: true,
                            }
                        }
                    },
                    take: 4
                }
            }
        })

        return { pool }
    })
}

