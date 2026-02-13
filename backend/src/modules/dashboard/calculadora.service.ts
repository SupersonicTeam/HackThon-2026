import { Injectable } from '@nestjs/common';

/**
 * Serviço para cálculo de impostos e simulação de preços
 * Independente de perfil de produtor ou notas fiscais
 */
@Injectable()
export class CalculadoraService {
  /**
   * Calcula impostos para uma operação
   */
  calcularImpostos(params: {
    dataFatoGerador: string;
    tipo: 'bem' | 'servico';
    uf: string;
    municipio: string;
    ncm: string;
    cst: string;
    classificacaoTributaria: string;
    valorBaseCalculo: number;
    quantidade: number;
    unidadeMedida: string;
  }) {
    const {
      dataFatoGerador,
      tipo,
      uf,
      municipio,
      ncm,
      cst,
      classificacaoTributaria,
      valorBaseCalculo,
      quantidade,
      unidadeMedida,
    } = params;

    // Valor total da operação
    const valorTotal = valorBaseCalculo * quantidade;

    // Cálculo de CBS (Contribuição sobre Bens e Serviços)
    const cbs = this.calcularCBS(valorTotal, tipo, classificacaoTributaria);

    // Cálculo de IBS (Imposto sobre Bens e Serviços)
    const ibs = this.calcularIBS(valorTotal, tipo, uf, classificacaoTributaria);

    // Cálculo do total de impostos
    const totalImpostos = cbs.valor + ibs.valor;

    // Valor líquido após impostos
    const valorLiquido = valorTotal - totalImpostos;

    // Percentual de impostos sobre o total
    const percentualImpostos = (totalImpostos / valorTotal) * 100;

    return {
      dataFatoGerador,
      tipo,
      uf,
      municipio,
      ncm,
      cst,
      classificacaoTributaria,
      valorBaseCalculo,
      quantidade,
      unidadeMedida,
      valorTotal,
      impostos: {
        cbs,
        ibs,
        total: totalImpostos,
        percentual: percentualImpostos,
      },
      valorLiquido,
      valorLiquidoPorUnidade: valorLiquido / quantidade,
    };
  }

  /**
   * Simula o melhor preço de venda para obter margem de lucro desejada
   */
  simularPrecoVenda(params: {
    custoProducao: number;
    quantidade: number;
    margemLucroDesejada: number; // percentual
    tipo: 'bem' | 'servico';
    uf?: string;
    classificacaoTributaria?: string;
  }) {
    const {
      custoProducao,
      quantidade,
      margemLucroDesejada,
      tipo,
      uf = 'PR',
      classificacaoTributaria = '',
    } = params;

    // Calcula preço inicial com margem desejada
    let precoVenda = custoProducao * (1 + margemLucroDesejada / 100);

    // Calcula impostos sobre esse preço
    let resultado = this.calcularImpostos({
      dataFatoGerador: new Date().toISOString().split('T')[0],
      tipo,
      uf,
      municipio: '',
      ncm: '',
      cst: '',
      classificacaoTributaria,
      valorBaseCalculo: precoVenda,
      quantidade,
      unidadeMedida: 'UN',
    });

    // Calcula lucro real
    let custoTotal = custoProducao * quantidade;
    let lucroReal = resultado.valorLiquido - custoTotal;
    let margemReal = (lucroReal / custoTotal) * 100;

    // Se a margem real for menor que a desejada, ajusta o preço
    let tentativas = 0;
    const maxTentativas = 10;

    while (margemReal < margemLucroDesejada && tentativas < maxTentativas) {
      // Aumenta o preço proporcionalmente
      const fatorAjuste = margemLucroDesejada / margemReal;
      precoVenda = precoVenda * fatorAjuste;

      // Recalcula
      resultado = this.calcularImpostos({
        dataFatoGerador: new Date().toISOString().split('T')[0],
        tipo,
        uf,
        municipio: '',
        ncm: '',
        cst: '',
        classificacaoTributaria,
        valorBaseCalculo: precoVenda,
        quantidade,
        unidadeMedida: 'UN',
      });

      lucroReal = resultado.valorLiquido - custoTotal;
      margemReal = (lucroReal / custoTotal) * 100;

      tentativas++;
    }

    return {
      custoProducao,
      quantidade,
      custoTotal,
      precoVendaSugerido: precoVenda,
      valorTotalVenda: resultado.valorTotal,
      impostos: resultado.impostos,
      valorLiquido: resultado.valorLiquido,
      lucroReal,
      margemLucroReal: margemReal,
      margemLucroDesejada,
      observacao:
        margemReal < margemLucroDesejada
          ? 'Atenção: Não foi possível atingir a margem desejada devido à carga tributária'
          : 'Margem de lucro desejada atingida',
    };
  }

  /**
   * Calcula CBS (Contribuição sobre Bens e Serviços) - Reforma Tributária
   */
  private calcularCBS(
    valorTotal: number,
    tipo: 'bem' | 'servico',
    classificacao?: string,
  ): {
    aliquota: number;
    valor: number;
    descricao: string;
  } {
    // Alíquota padrão CBS
    let aliquota = tipo === 'bem' ? 8.8 : 8.8; // Padrão 8,8%

    // Alíquotas reduzidas por classificação
    if (classificacao) {
      // Produtos da cesta básica e agropecuários
      const produtosReduzidos = [
        'cesta básica',
        'alimentos',
        'agropecuário',
        'agricultura',
        'soja',
        'milho',
        'trigo',
      ];

      if (
        produtosReduzidos.some((p) => classificacao.toLowerCase().includes(p))
      ) {
        aliquota = 6.0; // Alíquota reduzida
      }
    }

    const valor = (valorTotal * aliquota) / 100;

    return {
      aliquota,
      valor,
      descricao: `CBS ${aliquota}% - Contribuição sobre Bens e Serviços`,
    };
  }

  /**
   * Calcula IBS (Imposto sobre Bens e Serviços) - Reforma Tributária
   */
  private calcularIBS(
    valorTotal: number,
    tipo: 'bem' | 'servico',
    uf: string,
    classificacao?: string,
  ): {
    aliquota: number;
    valor: number;
    descricao: string;
  } {
    // Alíquota base por UF (estimativa)
    const aliquotasPorUF: Record<string, number> = {
      AC: 17.5,
      AL: 18.0,
      AP: 17.0,
      AM: 18.0,
      BA: 18.0,
      CE: 18.0,
      DF: 17.5,
      ES: 17.0,
      GO: 17.5,
      MA: 18.0,
      MT: 17.0,
      MS: 17.0,
      MG: 18.0,
      PA: 17.5,
      PB: 18.0,
      PR: 17.7,
      PE: 18.0,
      PI: 18.0,
      RJ: 18.0,
      RN: 18.0,
      RS: 17.5,
      RO: 17.5,
      RR: 17.0,
      SC: 17.0,
      SP: 18.0,
      SE: 18.0,
      TO: 17.0,
    };

    let aliquota = aliquotasPorUF[uf] || 17.7;

    // Redução para produtos da cesta básica
    if (classificacao) {
      const produtosReduzidos = [
        'cesta básica',
        'alimentos',
        'agropecuário',
        'agricultura',
        'soja',
        'milho',
        'trigo',
      ];

      if (
        produtosReduzidos.some((p) => classificacao.toLowerCase().includes(p))
      ) {
        aliquota = aliquota * 0.6; // 40% de redução
      }
    }

    const valor = (valorTotal * aliquota) / 100;

    return {
      aliquota: Number(aliquota.toFixed(2)),
      valor,
      descricao: `IBS ${aliquota.toFixed(1)}% - Imposto sobre Bens e Serviços (${uf})`,
    };
  }

  /**
   * Compara diferentes cenários de preço
   */
  compararCenarios(params: {
    custoProducao: number;
    quantidade: number;
    tipo: 'bem' | 'servico';
    uf?: string;
    classificacaoTributaria?: string;
    margensTeste: number[]; // Ex: [20, 30, 40, 50]
  }) {
    const { margensTeste, ...baseParams } = params;

    return margensTeste.map((margem) => {
      const simulacao = this.simularPrecoVenda({
        ...baseParams,
        margemLucroDesejada: margem,
      });

      return {
        margemDesejada: margem,
        precoVenda: simulacao.precoVendaSugerido,
        impostos: simulacao.impostos.total,
        percentualImpostos: simulacao.impostos.percentual,
        lucroReal: simulacao.lucroReal,
        margemReal: simulacao.margemLucroReal,
        viavel: simulacao.margemLucroReal >= margem * 0.9, // 90% da margem desejada é aceitável
      };
    });
  }
}
