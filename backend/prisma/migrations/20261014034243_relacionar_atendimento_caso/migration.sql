-- AlterTable
ALTER TABLE `atendimento` ADD COLUMN `casoId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Atendimento` ADD CONSTRAINT `Atendimento_casoId_fkey` FOREIGN KEY (`casoId`) REFERENCES `CasoJuridico`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
