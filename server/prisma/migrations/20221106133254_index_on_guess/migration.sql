/*
  Warnings:

  - A unique constraint covering the columns `[participantId,gameid]` on the table `Guess` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Guess_participantId_gameid_key" ON "Guess"("participantId", "gameid");
