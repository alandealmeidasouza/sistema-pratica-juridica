-- AlterTable
ALTER TABLE `casojuridico` ADD COLUMN `alunoId` VARCHAR(191) NULL,
    ADD COLUMN `professorId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `CasoJuridico` ADD CONSTRAINT `CasoJuridico_alunoId_fkey` FOREIGN KEY (`alunoId`) REFERENCES `Usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CasoJuridico` ADD CONSTRAINT `CasoJuridico_professorId_fkey` FOREIGN KEY (`professorId`) REFERENCES `Usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
