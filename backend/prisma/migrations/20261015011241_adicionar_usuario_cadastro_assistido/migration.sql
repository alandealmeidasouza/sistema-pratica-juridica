-- AlterTable
ALTER TABLE `assistido` ADD COLUMN `cadastradoPorId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Assistido` ADD CONSTRAINT `Assistido_cadastradoPorId_fkey` FOREIGN KEY (`cadastradoPorId`) REFERENCES `Usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
