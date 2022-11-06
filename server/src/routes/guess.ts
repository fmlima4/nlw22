import { FastifyInstance } from "fastify"
import { prisma } from "../lib/prisma"
import { z } from 'zod'
import { authenticate } from "../plugins/authenticate"

export async function guessRoutes (fastify: FastifyInstance) {
    fastify.get('/guesses/count', async () =>   {
        const count = await prisma.guess.count()

        return { count }
    })

    fastify.post('/pools/:poolId/:gameid/guesses',  {
        onRequest: [authenticate],
    }, async (request, reply) =>   {
        const createGuessParams = z.object({
            poolId: z.string(),
            gameid: z.string(),
        })

        const createGuessBody = z.object({
            firstTeamPoints: z.string(),
            secondTeamPoints: z.string(),
        })

        const { poolId, gameid } = createGuessParams.parse(request.params)
        const { firstTeamPoints, secondTeamPoints } = createGuessBody.parse(request.body)
        
        const participant = await prisma.participant.findUnique({
            where: {
                userId_poolId: {
                    poolId,
                    userId: request.user.sub
                }
            }
        })

        if(!participant){
            return reply.status(400).send({
                message: 'Voce nao faz parte desse bolão'
            })
        }

        const guess = await prisma.guess.findUnique({
            where: {
                participantId_gameid: {
                    participantId: participant.id,
                    gameid
                }
            }
        })

        if(guess){
            return reply.status(400).send({
                message: 'Voce ja mandou um palpite para este jogo'
            })
        }

        const game = await prisma.game.findUnique({
            where: {
                id: gameid
            }
        })

        if(!game){
            return reply.status(400).send({
                message: 'jogo nao encontrado'
            })
        }

        if(game.date < new Date()){
            return reply.status(400).send({
                message: 'voce só pode enviar palpites antes do jogo iniciar'
            })
        }

        await prisma.guess.create({
            data: {
                gameid,
                participantId: participant.id,
                firstTeamPoints,
                secondTeamPoints
            }
        })
        
        return reply.status(201).send();
 

    })
}

