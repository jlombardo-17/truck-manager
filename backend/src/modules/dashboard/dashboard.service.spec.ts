import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  const createQueryBuilderMock = (docs: any[] = []) => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(docs),
  });

  const createService = () => {
    const viajesRepository = {
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    const mantenimientoRepository = {
      find: jest.fn(),
    };
    const choferDocumentosRepository = {
      createQueryBuilder: jest.fn(),
    };

    const service = new DashboardService(
      viajesRepository as any,
      mantenimientoRepository as any,
      choferDocumentosRepository as any,
    );

    return {
      service,
      viajesRepository,
      mantenimientoRepository,
      choferDocumentosRepository,
    };
  };

  it('calcula el resumen mensual usando costos del viaje, comision del chofer y mantenimiento', async () => {
    const { service, viajesRepository, mantenimientoRepository, choferDocumentosRepository } =
      createService();

    viajesRepository.find
      .mockResolvedValueOnce([
        {
          camionId: 1,
          valorViaje: '1000',
          costoCombustible: '100',
          otrosGastos: '50',
          chofer: { porcentajeComision: '10' },
        },
      ])
      .mockResolvedValueOnce([{ camionId: 1 }]);

    mantenimientoRepository.find.mockResolvedValue([{ camionId: 1, costoReal: '200' }]);
    choferDocumentosRepository.createQueryBuilder.mockReturnValue(createQueryBuilderMock());

    const resumen = await service.getResumen();

    expect(resumen.ingresosDelMes).toBe(1000);
    expect(resumen.gastosDelMes).toBe(450);
    expect(resumen.gananciaNetaDelMes).toBe(550);
    expect(resumen.camionesActivos).toBe(1);
    expect(resumen.viajesCompletados).toBe(1);
  });

  it('calcula el desempeño de camiones con gastos del viaje y mantenimiento del mes', async () => {
    const { service, viajesRepository, mantenimientoRepository } = createService();

    viajesRepository.createQueryBuilder.mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          camionId: 1,
          valorViaje: '1000',
          costoCombustible: '100',
          otrosGastos: '50',
          kmRecorridos: '250',
          chofer: { porcentajeComision: '10' },
          camion: { patente: 'ABC123' },
        },
      ]),
    });

    mantenimientoRepository.find.mockResolvedValue([{ camionId: 1, costoReal: '200' }]);

    const [camion] = await service.getDesempenoCamiones();

    expect(camion).toMatchObject({
      id: 1,
      patente: 'ABC123',
      ingresos: 1000,
      gastos: 450,
      kmRecorridos: 250,
      viajesCompletos: 1,
    });
    expect(camion.eficiencia).toBe(55);
  });
});