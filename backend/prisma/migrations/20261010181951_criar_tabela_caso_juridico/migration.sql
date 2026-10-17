-- CreateTable
CREATE TABLE `CasoJuridico` (
    `id` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `descricao` TEXT NOT NULL,
    `situacao` ENUM('ABERTO', 'EM_ANDAMENTO', 'ENCERRADO') NOT NULL DEFAULT 'ABERTO',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `assistidoId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CasoJuridico` ADD CONSTRAINT `CasoJuridico_assistidoId_fkey` FOREIGN KEY (`assistidoId`) REFERENCES `Assistido`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
