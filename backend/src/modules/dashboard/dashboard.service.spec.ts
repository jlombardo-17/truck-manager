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

  const VIAJES_COLUMNS = [
    { Field: 'id' },
    { Field: 'camion_id' },
    { Field: 'chofer_id' },
    { Field: 'valorViaje' },
    { Field: 'costoCombustible' },
    { Field: 'otrosGastos' },
    { Field: 'kmRecorridos' },
    { Field: 'estado' },
    { Field: 'fechaInicio' },
  ];

  const COMISIONES_COLUMNS = [{ Field: 'viaje_id' }, { Field: 'montoTotal' }, { Field: 'estado' }];

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
    const choferDocumentosRepository = {
      createQueryBuilder: jest.fn(),
    };
    const salarioPagoRepository = {
      find: jest.fn(),
      query: jest.fn(),
    };
    const reportesService = {
      getCostosCamionPorPeriodo: jest.fn().mockResolvedValue(new Map()),
    };

    const service = new DashboardService(
      viajesRepository as any,
      camionesRepository as any,
      choferesRepository as any,
      choferDocumentosRepository as any,
      salarioPagoRepository as any,
      reportesService as any,
    );

    camionesRepository.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(1),
    });
    choferDocumentosRepository.createQueryBuilder.mockReturnValue(createQueryBuilderMock());

    return {
      service,
      viajesRepository,
      camionesRepository,
      choferesRepository,
      salarioPagoRepository,
      reportesService,
    };
  };

  /** Simula SHOW COLUMNS y devuelve `viajes` para cualquier SELECT sobre viajes. */
  const mockViajesQuery = (
    viajesRepository: { query: jest.Mock },
    viajes: any[],
    options: { pagosColumns?: boolean; comisionesColumns?: boolean } = {},
  ) => {
    const { pagosColumns = true, comisionesColumns = true } = options;
    viajesRepository.query.mockImplementation((sql: string) => {
      if (sql.includes('SHOW COLUMNS FROM choferes_salarios_pagos')) {
        return pagosColumns
          ? Promise.resolve([{ Field: 'fecha_pago' }, { Field: 'monto' }])
          : Promise.reject(new Error('Table "choferes_salarios_pagos" doesn\'t exist'));
      }
      if (sql.includes('SHOW COLUMNS FROM viajes_comisiones')) {
        return comisionesColumns
          ? Promise.resolve(COMISIONES_COLUMNS)
          : Promise.reject(new Error('Table "viajes_comisiones" doesn\'t exist'));
      }
      if (sql.includes('SHOW COLUMNS FROM viajes')) {
        return Promise.resolve(VIAJES_COLUMNS);
      }
      return Promise.resolve(viajes);
    });
  };

  it('calcula el resumen con gastos del viaje, sueldos pagados, mantenimiento y gastos fijos', async () => {
    const { service, viajesRepository, salarioPagoRepository, reportesService } = createService();

    mockViajesQuery(viajesRepository, [
      { valorViaje: '1000', costoCombustible: '100', otrosGastos: '50', gastosViaje: '75' },
    ]);
    salarioPagoRepository.query.mockResolvedValue([{ monto: '250' }]);
    reportesService.getCostosCamionPorPeriodo.mockResolvedValue(
      new Map([
        [1, { mantenimiento: 200, gastosFijos: 100 }],
        [2, { mantenimiento: 0, gastosFijos: 10 }],
      ]),
    );

    const resumen = await service.getResumen('2026-10-01', '2026-10-31');

    expect(resumen.ingresosDelMes).toBe(1000);
    expect(resumen.detalleGastosDelMes).toEqual({
      operativosViaje: 150,
      gastosViaje: 75,
      sueldos: 250,
      mantenimiento: 200,
      gastosFijos: 110,
    });
    expect(resumen.gastosDelMes).toBe(785);
    expect(resumen.gananciaNetaDelMes).toBe(215);
    expect(resumen.camionesActivos).toBe(1);
    expect(resumen.viajesCompletados).toBe(1);

    // El rango incluye el día completo en hora local
    const [desde, hasta] = reportesService.getCostosCamionPorPeriodo.mock.calls[0];
    expect(desde).toEqual(new Date(2026, 9, 1, 0, 0, 0, 0));
    expect(hasta).toEqual(new Date(2026, 9, 31, 23, 59, 59, 999));
  });

  it('excluye comisiones canceladas en la subconsulta de gastos del viaje', async () => {
    const { service, viajesRepository } = createService();
    mockViajesQuery(viajesRepository, []);

    await service.getResumen('2026-10-01', '2026-10-31');

    const selectViajes = viajesRepository.query.mock.calls
      .map(([sql]) => sql as string)
      .find((sql) => sql.includes('FROM viajes') && !sql.includes('SHOW COLUMNS'));
    expect(selectViajes).toContain('FROM viajes_comisiones c');
    expect(selectViajes).toContain("<> 'cancelado'");
  });

  it('no falla si Railway todavia no tiene las tablas de pagos de salarios ni comisiones', async () => {
    const { service, viajesRepository, reportesService } = createService();

    mockViajesQuery(
      viajesRepository,
      [{ valorViaje: '1000', costoCombustible: '100', otrosGastos: '50', gastosViaje: 0 }],
      { pagosColumns: false, comisionesColumns: false },
    );
    reportesService.getCostosCamionPorPeriodo.mockResolvedValue(new Map([[1, { mantenimiento: 200, gastosFijos: 0 }]]));

    const resumen = await service.getResumen('2026-03-15', '2026-04-15');

    expect(resumen.ingresosDelMes).toBe(1000);
    expect(resumen.detalleGastosDelMes.sueldos).toBe(0);
    expect(resumen.detalleGastosDelMes.gastosViaje).toBe(0);
    expect(resumen.gastosDelMes).toBe(350);
    expect(resumen.gananciaNetaDelMes).toBe(650);
  });

  it('calcula el desempeño de camiones con gastos del viaje, mantenimiento y gastos fijos del camión', async () => {
    const { service, viajesRepository, camionesRepository, reportesService } = createService();

    mockViajesQuery(viajesRepository, [
      {
        camionId: 1,
        valorViaje: '1000',
        costoCombustible: '100',
        otrosGastos: '50',
        gastosViaje: '40',
        kmRecorridos: '250',
      },
    ]);
    camionesRepository.findBy.mockResolvedValue([{ id: 1, patente: 'ABC123' }]);
    reportesService.getCostosCamionPorPeriodo.mockResolvedValue(new Map([[1, { mantenimiento: 200, gastosFijos: 310 }]]));

    const [camion] = await service.getDesempenoCamiones('2026-10-01', '2026-10-31');

    expect(camion).toMatchObject({
      id: 1,
      patente: 'ABC123',
      ingresos: 1000,
      gastos: 700,
      kmRecorridos: 250,
      viajesCompletos: 1,
    });
    expect(camion.eficiencia).toBe(30);
    expect(reportesService.getCostosCamionPorPeriodo.mock.calls[0][2]).toEqual([1]);
  });

  it('calcula el desempeño de choferes usando nombre y apellido del repositorio de choferes', async () => {
    const { service, viajesRepository, choferesRepository } = createService();

    mockViajesQuery(viajesRepository, [
      {
        choferId: 1,
        valorViaje: '1000',
        comisionesTotal: '150',
      },
    ]);
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
