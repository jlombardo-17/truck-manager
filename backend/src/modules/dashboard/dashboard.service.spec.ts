import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  const createQueryBuilderMock = (docs: any[] = []) => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(docs),
    getRawMany: jest.fn().mockResolvedValue(docs),
  });

  const createService = () => {
    const viajesRepository = {
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    const camionesRepository = {
      count: jest.fn(),
      findBy: jest.fn(),
    };
    const choferesRepository = {
      findBy: jest.fn(),
    };
    const mantenimientoRepository = {
      find: jest.fn(),
    };
    const documentosCamionRepository = {
      createQueryBuilder: jest.fn(),
    };
    const choferDocumentosRepository = {
      createQueryBuilder: jest.fn(),
    };
    const salarioPagoRepository = {
      find: jest.fn(),
    };

    const service = new DashboardService(
      viajesRepository as any,
      camionesRepository as any,
      choferesRepository as any,
      mantenimientoRepository as any,
      documentosCamionRepository as any,
      choferDocumentosRepository as any,
      salarioPagoRepository as any,
    );

    return {
      service,
      viajesRepository,
      camionesRepository,
      choferesRepository,
      mantenimientoRepository,
      documentosCamionRepository,
      choferDocumentosRepository,
      salarioPagoRepository,
    };
  };

  it('calcula el resumen mensual usando gastos operativos, sueldos pagados, mantenimiento y documentos', async () => {
    const {
      service,
      viajesRepository,
      camionesRepository,
      choferesRepository,
      mantenimientoRepository,
      documentosCamionRepository,
      choferDocumentosRepository,
      salarioPagoRepository,
    } = createService();

    viajesRepository.find
      .mockResolvedValueOnce([
        {
          camionId: 1,
          valorViaje: '1000',
          costoCombustible: '100',
          otrosGastos: '50',
        },
      ]);

    camionesRepository.count.mockResolvedValue(1);
  choferesRepository.findBy.mockResolvedValue([]);
    mantenimientoRepository.find.mockResolvedValue([{ camionId: 1, costoReal: '200' }]);
    salarioPagoRepository.find.mockResolvedValue([{ monto: '250' }]);
    documentosCamionRepository.createQueryBuilder.mockReturnValue(
      createQueryBuilderMock([{ camionId: 1, costo: '50' }]),
    );
    choferDocumentosRepository.createQueryBuilder.mockReturnValue(createQueryBuilderMock());

    const resumen = await service.getResumen();

    expect(resumen.ingresosDelMes).toBe(1000);
    expect(resumen.gastosDelMes).toBe(650);
    expect(resumen.gananciaNetaDelMes).toBe(350);
    expect(resumen.camionesActivos).toBe(1);
    expect(resumen.viajesCompletados).toBe(1);
  });

  it('calcula el desempeño de camiones con gastos del viaje, mantenimiento y documentos del mes', async () => {
    const { service, viajesRepository, camionesRepository, mantenimientoRepository, documentosCamionRepository } =
      createService();

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
        },
      ]),
    });

    camionesRepository.findBy.mockResolvedValue([{ id: 1, patente: 'ABC123' }]);
    mantenimientoRepository.find.mockResolvedValue([{ camionId: 1, costoReal: '200' }]);
    documentosCamionRepository.createQueryBuilder.mockReturnValue(
      createQueryBuilderMock([{ camionId: 1, costo: '50' }]),
    );

  });

  it('calcula el desempeño de choferes usando nombre y apellido del repositorio de choferes', async () => {
    const { service, viajesRepository, choferesRepository } = createService();

    viajesRepository.createQueryBuilder.mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          choferId: 1,
          valorViaje: '1000',
          comisiones: [{ montoTotal: '150' }],
        },
      ]),
    });

    choferesRepository.findBy.mockResolvedValue([{ id: 1, nombre: 'Matias', apellido: 'Velazquez' }]);

    const [chofer] = await service.getDesempenoChoferes();

    expect(chofer).toMatchObject({
      id: 1,
      nombre: 'Matias Velazquez',
      viajesCompletos: 1,
      ingresos: 1000,
      comisiones: 150,
      puntualidad: 100,
    });

    const [camion] = await service.getDesempenoCamiones();

    expect(camion).toMatchObject({
      id: 1,
      patente: 'ABC123',
      ingresos: 1000,
      gastos: 400,
      kmRecorridos: 250,
      viajesCompletos: 1,
    });
    expect(camion.eficiencia).toBe(60);
  });
});