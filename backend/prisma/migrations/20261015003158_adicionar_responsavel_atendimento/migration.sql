-- AlterTable
ALTER TABLE `atendimento` ADD COLUMN `responsavelId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Atendimento` ADD CONSTRAINT `Atendimento_responsavelId_fkey` FOREIGN KEY (`responsavelId`) REFERENCES `Usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
