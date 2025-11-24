import { distance } from 'fastest-levenshtein';
import logger from '@/config/logger.js';

interface CandidatoQdrant {
    score: number;
    payload: {
        nombre: string;
        categoria?: string;
        subcategoria?: string;
        huella_categoria?: number;
        [key: string]: any;
    };
}

interface CandidatoConScore extends CandidatoQdrant {
    scoreTokens: number;
    scoreFuzzy: number;
    scoreCombinado: number;
}

export class AdvancedMatcherService {
    private static verificarTokensPresentes(nombreOCR: string, nombreCandidato: string): number {
        const palabrasOCR = nombreOCR.toUpperCase().trim().split(/\s+/);
        const nombreCandidatoUpper = nombreCandidato.toUpperCase();
        
        const palabrasPresentes = palabrasOCR.filter(palabra => 
            nombreCandidatoUpper.includes(palabra)
        );
        
        return palabrasPresentes.length / palabrasOCR.length;
    }

    private static calcularFuzzyScore(a: string, b: string): number {
        const aUpper = a.toUpperCase().trim();
        const bUpper = b.toUpperCase().trim();
        
        const dist = distance(aUpper, bUpper);
        const maxLen = Math.max(aUpper.length, bUpper.length);
        
        return 1 - (dist / maxLen);
    }

    private static calcularScoreCombinado(
        scoreEmbedding: number,
        scoreTokens: number,
        scoreFuzzy: number
    ): number {
        return (scoreEmbedding * 0.4) + (scoreTokens * 0.4) + (scoreFuzzy * 0.2);
    }

    static reRankearCandidatos(
        nombreOCR: string,
        candidatos: CandidatoQdrant[]
    ): CandidatoConScore[] {
        const candidatosConScore: CandidatoConScore[] = candidatos.map(candidato => {
            const nombreCandidato = candidato.payload.nombre || '';
            
            const scoreTokens = this.verificarTokensPresentes(nombreOCR, nombreCandidato);
            const scoreFuzzy = this.calcularFuzzyScore(nombreOCR, nombreCandidato);
            const scoreCombinado = this.calcularScoreCombinado(
                candidato.score,
                scoreTokens,
                scoreFuzzy
            );

            return {
                ...candidato,
                scoreTokens,
                scoreFuzzy,
                scoreCombinado,
            };
        });

        candidatosConScore.sort((a, b) => b.scoreCombinado - a.scoreCombinado);

        logger.debug('🔄 Re-ranking completado', {
            nombreOCR,
            candidatos: candidatosConScore.map(c => ({
                nombre: c.payload.nombre,
                scoreEmbedding: Math.round(c.score * 100) / 100,
                scoreTokens: Math.round(c.scoreTokens * 100) / 100,
                scoreFuzzy: Math.round(c.scoreFuzzy * 100) / 100,
                scoreCombinado: Math.round(c.scoreCombinado * 100) / 100,
            }))
        });

        return candidatosConScore;
    }

    static encontrarMejorMatch(
        nombreOCR: string,
        candidatos: CandidatoQdrant[],
        umbralCombinado: number = 0.65
    ): CandidatoConScore | null {
        if (candidatos.length === 0) {
            return null;
        }

        const candidatosReRankeados = this.reRankearCandidatos(nombreOCR, candidatos);
        const mejorCandidato = candidatosReRankeados[0];

        if (mejorCandidato.scoreCombinado >= umbralCombinado) {
            logger.info('✅ Match encontrado con búsqueda híbrida', {
                nombreOCR,
                nombreMatch: mejorCandidato.payload.nombre,
                scoreEmbedding: Math.round(mejorCandidato.score * 100) / 100,
                scoreTokens: Math.round(mejorCandidato.scoreTokens * 100) / 100,
                scoreFuzzy: Math.round(mejorCandidato.scoreFuzzy * 100) / 100,
                scoreCombinado: Math.round(mejorCandidato.scoreCombinado * 100) / 100,
            });
            return mejorCandidato;
        }

        logger.warn('⚠️ Mejor candidato no alcanza umbral combinado', {
            nombreOCR,
            mejorScore: Math.round(mejorCandidato.scoreCombinado * 100) / 100,
            umbralRequerido: umbralCombinado,
        });

        return null;
    }
}