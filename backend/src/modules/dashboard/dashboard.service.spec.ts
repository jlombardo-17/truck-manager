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
    getCount: jest.fn().mockResolvedValue(docs),
    getMany: jest.fn().mockResolvedValue(docs),
    getRawMany: jest.fn().mockResolvedValue(docs),
  });

  const getCurrentMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  };

  const createService = () => {
    const viajesRepository = {
      find: jest.fn(),
      query: jest.fn(),
    };
    const camionesRepository = {
      createQueryBuilder: jest.fn(),
      find: jest.fn(),
      findBy: jest.fn(),
    };
    const choferesRepository = {
      find: jest.fn(),
      findBy: jest.fn(),
    };
    const mantenimientoRepository = {
      find: jest.fn(),
    };
    const documentosCamionRepository = {
      find: jest.fn(),
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
      mantenimientoRepository,
      documentosCamionRepository,
      choferDocumentosRepository,
      salarioPagoRepository,
    } = createService();
    const { start, end } = getCurrentMonthRange();

    viajesRepository.find
      .mockResolvedValueOnce([
        {
          camionId: 1,
          valorViaje: '1000',
          costoCombustible: '100',
          otrosGastos: '50',
        },
      ]);

    camionesRepository.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(1),
    });
    mantenimientoRepository.find.mockResolvedValue([{ camionId: 1, costoReal: '200' }]);
    salarioPagoRepository.find.mockResolvedValue([{ monto: '250' }]);
    documentosCamionRepository.find.mockResolvedValue([
      { camionId: 1, costo: '310', createdAt: start, fechaVencimiento: end },
    ]);
    choferDocumentosRepository.createQueryBuilder.mockReturnValue(createQueryBuilderMock());

    const resumen = await service.getResumen();

    expect(resumen.ingresosDelMes).toBe(1000);
    expect(resumen.gastosDelMes).toBe(910);
    expect(resumen.gananciaNetaDelMes).toBe(90);
    expect(resumen.camionesActivos).toBe(1);
    expect(resumen.viajesCompletados).toBe(1);
    expect(resumen.detalleGastosDelMes).toMatchObject({
      operativosViaje: 150,
      sueldos: 250,
      mantenimiento: 200,
      documentosFijos: 310,
    });
  });

  it('calcula el desempeño de camiones con costos documentales proyectados para el mes', async () => {
    const { service, viajesRepository, camionesRepository, mantenimientoRepository, documentosCamionRepository } =
      createService();
    const { start, end } = getCurrentMonthRange();

    viajesRepository.query.mockImplementation((sql: string) => {
      if (sql.includes('SHOW COLUMNS FROM viajes')) {
        return Promise.resolve([
          { Field: 'camion_id' },
          { Field: 'valorViaje' },
          { Field: 'costoCombustible' },
          { Field: 'otrosGastos' },
          { Field: 'kmRecorridos' },
          { Field: 'estado' },
          { Field: 'fechaInicio' },
        ]);
      }

      return Promise.resolve([
        {
          camionId: 1,
          valorViaje: '1000',
          costoCombustible: '100',
          otrosGastos: '50',
          kmRecorridos: '250',
        },
      ]);
    });

    camionesRepository.findBy.mockResolvedValue([{ id: 1, patente: 'ABC123' }]);
    mantenimientoRepository.find.mockResolvedValue([{ camionId: 1, costoReal: '200' }]);
    documentosCamionRepository.find.mockResolvedValue([
      { camionId: 1, costo: '310', createdAt: start, fechaVencimiento: end },
    ]);

    const [camion] = await service.getDesempenoCamiones();

    expect(camion).toMatchObject({
      id: 1,
      patente: 'ABC123',
      ingresos: 1000,
      gastos: 660,
      kmRecorridos: 250,
      viajesCompletos: 1,
    });
    expect(camion.eficiencia).toBe(34);

  });

  it('calcula el desempeño de choferes usando nombre y apellido del repositorio de choferes', async () => {
    const { service, viajesRepository, choferesRepository } = createService();

    viajesRepository.query.mockImplementation((sql: string) => {
      if (sql.includes('SHOW COLUMNS FROM viajes_comisiones')) {
        return Promise.resolve([
          { Field: 'viaje_id' },
          { Field: 'montoTotal' },
        ]);
      }

      if (sql.includes('SHOW COLUMNS FROM viajes')) {
        return Promise.resolve([
          { Field: 'id' },
          { Field: 'chofer_id' },
          { Field: 'valorViaje' },
          { Field: 'estado' },
          { Field: 'fechaInicio' },
        ]);
      }

      return Promise.resolve([
        {
          choferId: 1,
          valorViaje: '1000',
          comisionesTotal: '150',
        },
      ]);
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
  });
});