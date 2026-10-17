-- CreateTable
CREATE TABLE `HistoricoCaso` (
    `id` VARCHAR(191) NOT NULL,
    `descricao` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `casoId` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `HistoricoCaso` ADD CONSTRAINT `HistoricoCaso_casoId_fkey` FOREIGN KEY (`casoId`) REFERENCES `CasoJuridico`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HistoricoCaso` ADD CONSTRAINT `HistoricoCaso_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
