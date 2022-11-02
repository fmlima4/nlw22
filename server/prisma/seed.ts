import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.create({
        data: { 
            name: 'John',
            email: 'john@example.com',
            avatarUrl: 'http://example.com'
        }
    })

    const pool = await prisma.pool.create({
        data: {
            title: 'init Pool',
            code: '123456',
            ownerId: user.id,

            participants: {
                create: {
                    userId: user.id
                }
            }
        }
    })

    await prisma.game.create({
        data: { 
            date: '2022-01-11T14:03:03.201Z',
            firstTeamCountryCode: 'US',
            secondTeamCountryCode: 'BR'
        }
    })

    await prisma.game.create({
        data: { 
            date: '2022-02-11T14:03:03.201Z',
            firstTeamCountryCode: 'AR',
            secondTeamCountryCode: 'DE',

            guesses: {
                create: {
                    firstTeamPoints: '2',
                    secondTeamPoints: '0',

                    partcipant: {
                        connect: {
                            userId_poolId: {
                                userId: user.id,
                                poolId: pool.id
                            }
                        }
                    }
                }
            }
        }
    })    
}

main()