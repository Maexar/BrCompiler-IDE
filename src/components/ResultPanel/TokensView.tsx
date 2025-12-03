import { useState } from 'react';
import styles from './TokensView.module.css';
import type { Token } from '../../api';

interface TokensViewProps {
  tokens: Token[];
}

type FilterType = 'todos' | 'palavras-chave' | 'identificadores' | 'literais' | 'operadores' | 'delimitadores';

const KEYWORDS = [
  'printa', 'papa-entrada', 'pet', 'repet', 'vai-filhao', 'devolva',
  'tropa-do-gordao', 'recrutar', 'expulsar', 'tamanho', 'sanduiche-iche',
  'montar-sanduba', 'comer-sanduba', 'olho-gordo', 'farelo', 'gambiarra',
  'abre-te-sesamo', 'fecha-te-sesamo', 'stonks', 'fiado', 'textao',
  'eh-migue', 'sim', 'nao', 'receba', 'sepa', 'da-teus-pulo'
];

const OPERATORS = ['+', '-', '*', '/', '>', '==', '<', '!=', '>=', '<=', '&&', '|'];
const DELIMITERS = [';', ',', '[', ']', '(', ')', 'br'];

export function TokensView({ tokens }: TokensViewProps) {
  const [filter, setFilter] = useState<FilterType>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  const getTokenCategory = (token: Token): FilterType => {
    const valor = token.valor.toLowerCase();
    const tipo = token.tipo.toLowerCase();

    if (KEYWORDS.includes(valor)) return 'palavras-chave';
    if (tipo === 'identificador') return 'identificadores';
    if (tipo.includes('literal') || tipo.includes('constante')) return 'literais';
    if (OPERATORS.includes(valor)) return 'operadores';
    if (DELIMITERS.includes(valor)) return 'delimitadores';

    return 'todos';
  };

  const filteredTokens = tokens.filter((token) => {
    const matchesFilter = filter === 'todos' || getTokenCategory(token) === filter;
    const matchesSearch = searchTerm === '' ||
      token.valor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.tipo.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getCategoryColor = (category: FilterType): string => {
    switch (category) {
      case 'palavras-chave': return '#3b82f6';
      case 'identificadores': return '#10b981';
      case 'literais': return '#f59e0b';
      case 'operadores': return '#ef4444';
      case 'delimitadores': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  return (
    <div className={styles['tokens-view']}>
      <div className={styles['tokens-controls']}>
        <div className={styles['search-box']}>
          <input
            type="text"
            placeholder="Buscar tokens..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles['search-input']}
          />
        </div>

        <div className={styles['filter-buttons']}>
          <button
            className={`${styles['filter-btn']} ${filter === 'todos' ? styles['active'] : ''}`}
            onClick={() => setFilter('todos')}
          >
            Todos ({tokens.length})
          </button>
          <button
            className={`${styles['filter-btn']} ${filter === 'palavras-chave' ? styles['active'] : ''}`}
            onClick={() => setFilter('palavras-chave')}
          >
            Palavras-chave
          </button>
          <button
            className={`${styles['filter-btn']} ${filter === 'identificadores' ? styles['active'] : ''}`}
            onClick={() => setFilter('identificadores')}
          >
            Identificadores
          </button>
          <button
            className={`${styles['filter-btn']} ${filter === 'literais' ? styles['active'] : ''}`}
            onClick={() => setFilter('literais')}
          >
            Literais
          </button>
          <button
            className={`${styles['filter-btn']} ${filter === 'operadores' ? styles['active'] : ''}`}
            onClick={() => setFilter('operadores')}
          >
            Operadores
          </button>
          <button
            className={`${styles['filter-btn']} ${filter === 'delimitadores' ? styles['active'] : ''}`}
            onClick={() => setFilter('delimitadores')}
          >
            Delimitadores
          </button>
        </div>
      </div>

      <div className={styles['tokens-content']}>
        {filteredTokens.length === 0 ? (
          <div className={styles['no-tokens']}>
            {searchTerm ? 'Nenhum token encontrado' : 'Nenhum token encontrado'}
          </div>
        ) : (
          <div className={styles['tokens-grid']}>
            {filteredTokens.map((token, index) => {
              const category = getTokenCategory(token);
              const categoryColor = getCategoryColor(category);

              return (
                <div
                  key={index}
                  className={styles['token-card']}
                  style={{ borderLeftColor: categoryColor }}
                >
                  <div className={styles['token-header']}>
                    <span
                      className={styles['token-category']}
                      style={{ backgroundColor: categoryColor }}
                    >
                      {category}
                    </span>
                    <span className={styles['token-position']}>
                      L{token.linha}:C{token.coluna}
                    </span>
                  </div>
                  <div className={styles['token-body']}>
                    <div className={styles['token-value']}>{token.valor}</div>
                    <div className={styles['token-type']}>{token.tipo}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles['tokens-footer']}>
        {filteredTokens.length} token(s) exibido(s)
      </div>
    </div>
  );
}
