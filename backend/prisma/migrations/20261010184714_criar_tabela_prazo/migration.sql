-- CreateTable
CREATE TABLE `Prazo` (
    `id` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `dataLimite` DATETIME(3) NOT NULL,
    `concluido` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `casoId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Prazo` ADD CONSTRAINT `Prazo_casoId_fkey` FOREIGN KEY (`casoId`) REFERENCES `CasoJuridico`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
