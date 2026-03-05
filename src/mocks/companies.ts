import type { Company } from '../types'

// ─── Dados base para geração ───────────────────────────────────────

// coast: direção segura para o offset ('n'|'s'|'e'|'w'|'ne'|'nw'|'se'|'sw') — empurra para o interior
const CITIES: { municipio: string; uf: string; lat: number; lng: number; ddd: string; coast?: string }[] = [
  // ── SP Capital e Grande SP ──
  { municipio: 'São Paulo', uf: 'SP', lat: -23.5505, lng: -46.6333, ddd: '11' },
  { municipio: 'Guarulhos', uf: 'SP', lat: -23.4538, lng: -46.5333, ddd: '11' },
  { municipio: 'Osasco', uf: 'SP', lat: -23.5325, lng: -46.7917, ddd: '11' },
  { municipio: 'Santo André', uf: 'SP', lat: -23.6737, lng: -46.5432, ddd: '11' },
  { municipio: 'São Bernardo do Campo', uf: 'SP', lat: -23.6914, lng: -46.5646, ddd: '11' },
  { municipio: 'Barueri', uf: 'SP', lat: -23.5114, lng: -46.8761, ddd: '11' },
  { municipio: 'Mogi das Cruzes', uf: 'SP', lat: -23.5227, lng: -46.1858, ddd: '11' },
  { municipio: 'Diadema', uf: 'SP', lat: -23.6861, lng: -46.6228, ddd: '11' },
  { municipio: 'Carapicuíba', uf: 'SP', lat: -23.5224, lng: -46.8357, ddd: '11' },
  { municipio: 'Itaquaquecetuba', uf: 'SP', lat: -23.4867, lng: -46.3486, ddd: '11' },
  { municipio: 'Taboão da Serra', uf: 'SP', lat: -23.6019, lng: -46.7582, ddd: '11' },
  { municipio: 'Cotia', uf: 'SP', lat: -23.6037, lng: -46.9192, ddd: '11' },
  // ── SP Interior ──
  { municipio: 'Campinas', uf: 'SP', lat: -22.9099, lng: -47.0626, ddd: '19' },
  { municipio: 'São José dos Campos', uf: 'SP', lat: -23.1896, lng: -45.8841, ddd: '12' },
  { municipio: 'Sorocaba', uf: 'SP', lat: -23.5015, lng: -47.4526, ddd: '15' },
  { municipio: 'Ribeirão Preto', uf: 'SP', lat: -21.1704, lng: -47.8103, ddd: '16' },
  { municipio: 'Santos', uf: 'SP', lat: -23.9608, lng: -46.3336, ddd: '13', coast: 'nw' },
  { municipio: 'Jundiaí', uf: 'SP', lat: -23.1857, lng: -46.8978, ddd: '11' },
  { municipio: 'Piracicaba', uf: 'SP', lat: -22.7338, lng: -47.6476, ddd: '19' },
  { municipio: 'Bauru', uf: 'SP', lat: -22.3246, lng: -49.0871, ddd: '14' },
  { municipio: 'São José do Rio Preto', uf: 'SP', lat: -20.8113, lng: -49.3758, ddd: '17' },
  { municipio: 'Taubaté', uf: 'SP', lat: -23.0204, lng: -45.5558, ddd: '12' },
  { municipio: 'Limeira', uf: 'SP', lat: -22.5642, lng: -47.4013, ddd: '19' },
  { municipio: 'Franca', uf: 'SP', lat: -20.5390, lng: -47.4008, ddd: '16' },
  { municipio: 'Presidente Prudente', uf: 'SP', lat: -22.1207, lng: -51.3882, ddd: '18' },
  { municipio: 'Araraquara', uf: 'SP', lat: -21.7845, lng: -48.1780, ddd: '16' },
  { municipio: 'Marília', uf: 'SP', lat: -22.2100, lng: -49.9461, ddd: '14' },
  { municipio: 'Americana', uf: 'SP', lat: -22.7374, lng: -47.3313, ddd: '19' },
  { municipio: 'São Carlos', uf: 'SP', lat: -22.0174, lng: -47.8909, ddd: '16' },
  { municipio: 'Indaiatuba', uf: 'SP', lat: -23.0903, lng: -47.2181, ddd: '19' },
  { municipio: 'Itu', uf: 'SP', lat: -23.2640, lng: -47.2990, ddd: '11' },
  { municipio: 'Jacareí', uf: 'SP', lat: -23.3050, lng: -45.9689, ddd: '12' },
  { municipio: 'Guaratinguetá', uf: 'SP', lat: -22.8166, lng: -45.1924, ddd: '12' },
  { municipio: 'Araçatuba', uf: 'SP', lat: -21.2089, lng: -50.4328, ddd: '18' },
  { municipio: 'Catanduva', uf: 'SP', lat: -21.1371, lng: -48.9726, ddd: '17' },
  { municipio: 'Assis', uf: 'SP', lat: -22.6617, lng: -50.4122, ddd: '18' },
  { municipio: 'Botucatu', uf: 'SP', lat: -22.8863, lng: -48.4454, ddd: '14' },
  { municipio: 'Atibaia', uf: 'SP', lat: -23.1171, lng: -46.5506, ddd: '11' },
  { municipio: 'Registro', uf: 'SP', lat: -24.4874, lng: -47.8436, ddd: '13', coast: 'n' },
  // ── RJ ──
  { municipio: 'Rio de Janeiro', uf: 'RJ', lat: -22.9068, lng: -43.1729, ddd: '21', coast: 'nw' },
  { municipio: 'Niterói', uf: 'RJ', lat: -22.8833, lng: -43.1036, ddd: '21', coast: 'n' },
  { municipio: 'São Gonçalo', uf: 'RJ', lat: -22.8269, lng: -43.0634, ddd: '21', coast: 'nw' },
  { municipio: 'Petrópolis', uf: 'RJ', lat: -22.5046, lng: -43.1823, ddd: '24' },
  { municipio: 'Duque de Caxias', uf: 'RJ', lat: -22.7856, lng: -43.3117, ddd: '21' },
  { municipio: 'Nova Iguaçu', uf: 'RJ', lat: -22.7592, lng: -43.4510, ddd: '21' },
  { municipio: 'Campos dos Goytacazes', uf: 'RJ', lat: -21.7545, lng: -41.3244, ddd: '22', coast: 'w' },
  { municipio: 'Volta Redonda', uf: 'RJ', lat: -22.5232, lng: -44.1042, ddd: '24' },
  { municipio: 'Macaé', uf: 'RJ', lat: -22.3768, lng: -41.7869, ddd: '22', coast: 'w' },
  { municipio: 'Cabo Frio', uf: 'RJ', lat: -22.8789, lng: -42.0187, ddd: '22', coast: 'nw' },
  { municipio: 'Angra dos Reis', uf: 'RJ', lat: -23.0067, lng: -44.3182, ddd: '24', coast: 'n' },
  { municipio: 'Teresópolis', uf: 'RJ', lat: -22.4121, lng: -42.9653, ddd: '21' },
  { municipio: 'Nova Friburgo', uf: 'RJ', lat: -22.2818, lng: -42.5311, ddd: '22' },
  // ── MG ──
  { municipio: 'Belo Horizonte', uf: 'MG', lat: -19.9167, lng: -43.9345, ddd: '31' },
  { municipio: 'Uberlândia', uf: 'MG', lat: -18.9186, lng: -48.2772, ddd: '34' },
  { municipio: 'Juiz de Fora', uf: 'MG', lat: -21.7642, lng: -43.3503, ddd: '32' },
  { municipio: 'Contagem', uf: 'MG', lat: -19.9320, lng: -44.0539, ddd: '31' },
  { municipio: 'Betim', uf: 'MG', lat: -19.9677, lng: -44.1984, ddd: '31' },
  { municipio: 'Montes Claros', uf: 'MG', lat: -16.7350, lng: -43.8617, ddd: '38' },
  { municipio: 'Uberaba', uf: 'MG', lat: -19.7472, lng: -47.9319, ddd: '34' },
  { municipio: 'Governador Valadares', uf: 'MG', lat: -18.8509, lng: -41.9494, ddd: '33' },
  { municipio: 'Ipatinga', uf: 'MG', lat: -19.4683, lng: -42.5367, ddd: '31' },
  { municipio: 'Poços de Caldas', uf: 'MG', lat: -21.7878, lng: -46.5613, ddd: '35' },
  { municipio: 'Divinópolis', uf: 'MG', lat: -20.1389, lng: -44.8842, ddd: '37' },
  { municipio: 'Sete Lagoas', uf: 'MG', lat: -19.4566, lng: -44.2468, ddd: '31' },
  { municipio: 'Patos de Minas', uf: 'MG', lat: -18.5780, lng: -46.5181, ddd: '34' },
  { municipio: 'Pouso Alegre', uf: 'MG', lat: -22.2299, lng: -45.9369, ddd: '35' },
  { municipio: 'Varginha', uf: 'MG', lat: -21.5515, lng: -45.4303, ddd: '35' },
  { municipio: 'Barbacena', uf: 'MG', lat: -21.2256, lng: -43.7711, ddd: '32' },
  { municipio: 'Lavras', uf: 'MG', lat: -21.2450, lng: -45.0008, ddd: '35' },
  { municipio: 'Teófilo Otoni', uf: 'MG', lat: -17.8575, lng: -41.5086, ddd: '33' },
  // ── PR ──
  { municipio: 'Curitiba', uf: 'PR', lat: -25.4284, lng: -49.2733, ddd: '41' },
  { municipio: 'Londrina', uf: 'PR', lat: -23.3045, lng: -51.1696, ddd: '43' },
  { municipio: 'Maringá', uf: 'PR', lat: -23.4205, lng: -51.9333, ddd: '44' },
  { municipio: 'Cascavel', uf: 'PR', lat: -24.9578, lng: -53.4596, ddd: '45' },
  { municipio: 'Ponta Grossa', uf: 'PR', lat: -25.0945, lng: -50.1633, ddd: '42' },
  { municipio: 'Foz do Iguaçu', uf: 'PR', lat: -25.5163, lng: -54.5854, ddd: '45' },
  { municipio: 'Guarapuava', uf: 'PR', lat: -25.3935, lng: -51.4620, ddd: '42' },
  { municipio: 'Paranaguá', uf: 'PR', lat: -25.5205, lng: -48.5095, ddd: '41', coast: 'w' },
  { municipio: 'Toledo', uf: 'PR', lat: -24.7246, lng: -53.7432, ddd: '45' },
  { municipio: 'Apucarana', uf: 'PR', lat: -23.5508, lng: -51.4608, ddd: '43' },
  { municipio: 'Umuarama', uf: 'PR', lat: -23.7664, lng: -53.3253, ddd: '44' },
  { municipio: 'Campo Mourão', uf: 'PR', lat: -24.0463, lng: -52.3786, ddd: '44' },
  // ── SC ──
  { municipio: 'Florianópolis', uf: 'SC', lat: -27.5954, lng: -48.5480, ddd: '48', coast: 'w' },
  { municipio: 'Joinville', uf: 'SC', lat: -26.3045, lng: -48.8487, ddd: '47' },
  { municipio: 'Blumenau', uf: 'SC', lat: -26.9194, lng: -49.0661, ddd: '47' },
  { municipio: 'Chapecó', uf: 'SC', lat: -27.1006, lng: -52.6152, ddd: '49' },
  { municipio: 'Criciúma', uf: 'SC', lat: -28.6775, lng: -49.3697, ddd: '48', coast: 'w' },
  { municipio: 'Itajaí', uf: 'SC', lat: -26.9101, lng: -48.6705, ddd: '47', coast: 'w' },
  { municipio: 'Lages', uf: 'SC', lat: -27.8161, lng: -50.3261, ddd: '49' },
  { municipio: 'Jaraguá do Sul', uf: 'SC', lat: -26.4854, lng: -49.0713, ddd: '47' },
  { municipio: 'Balneário Camboriú', uf: 'SC', lat: -26.9906, lng: -48.6352, ddd: '47', coast: 'w' },
  { municipio: 'Tubarão', uf: 'SC', lat: -28.4668, lng: -49.0068, ddd: '48', coast: 'w' },
  // ── RS ──
  { municipio: 'Porto Alegre', uf: 'RS', lat: -30.0346, lng: -51.2177, ddd: '51', coast: 'n' },
  { municipio: 'Caxias do Sul', uf: 'RS', lat: -29.1681, lng: -51.1794, ddd: '54' },
  { municipio: 'Canoas', uf: 'RS', lat: -29.9178, lng: -51.1740, ddd: '51' },
  { municipio: 'Pelotas', uf: 'RS', lat: -31.7654, lng: -52.3376, ddd: '53' },
  { municipio: 'Santa Maria', uf: 'RS', lat: -29.6842, lng: -53.8069, ddd: '55' },
  { municipio: 'Novo Hamburgo', uf: 'RS', lat: -29.6788, lng: -51.1300, ddd: '51' },
  { municipio: 'Passo Fundo', uf: 'RS', lat: -28.2624, lng: -52.4068, ddd: '54' },
  { municipio: 'São Leopoldo', uf: 'RS', lat: -29.7604, lng: -51.1480, ddd: '51' },
  { municipio: 'Rio Grande', uf: 'RS', lat: -32.0349, lng: -52.0986, ddd: '53', coast: 'n' },
  { municipio: 'Gravataí', uf: 'RS', lat: -29.9447, lng: -50.9920, ddd: '51' },
  { municipio: 'Bento Gonçalves', uf: 'RS', lat: -29.1715, lng: -51.5188, ddd: '54' },
  { municipio: 'Erechim', uf: 'RS', lat: -27.6342, lng: -52.2735, ddd: '54' },
  { municipio: 'Bagé', uf: 'RS', lat: -31.3287, lng: -54.1069, ddd: '53' },
  { municipio: 'Uruguaiana', uf: 'RS', lat: -29.7547, lng: -57.0883, ddd: '55' },
  { municipio: 'Santa Cruz do Sul', uf: 'RS', lat: -29.7176, lng: -52.4260, ddd: '51' },
  // ── DF ──
  { municipio: 'Brasília', uf: 'DF', lat: -15.7975, lng: -47.8919, ddd: '61' },
  { municipio: 'Taguatinga', uf: 'DF', lat: -15.8362, lng: -48.0542, ddd: '61' },
  { municipio: 'Ceilândia', uf: 'DF', lat: -15.8200, lng: -48.1117, ddd: '61' },
  // ── GO ──
  { municipio: 'Goiânia', uf: 'GO', lat: -16.6869, lng: -49.2648, ddd: '62' },
  { municipio: 'Aparecida de Goiânia', uf: 'GO', lat: -16.8198, lng: -49.2469, ddd: '62' },
  { municipio: 'Anápolis', uf: 'GO', lat: -16.3281, lng: -48.9530, ddd: '62' },
  { municipio: 'Rio Verde', uf: 'GO', lat: -17.7928, lng: -50.9192, ddd: '64' },
  { municipio: 'Catalão', uf: 'GO', lat: -18.1656, lng: -47.9461, ddd: '64' },
  { municipio: 'Itumbiara', uf: 'GO', lat: -18.4192, lng: -49.2156, ddd: '64' },
  { municipio: 'Jataí', uf: 'GO', lat: -17.8819, lng: -51.7142, ddd: '64' },
  // ── BA ──
  { municipio: 'Salvador', uf: 'BA', lat: -12.9714, lng: -38.5124, ddd: '71', coast: 'w' },
  { municipio: 'Feira de Santana', uf: 'BA', lat: -12.2669, lng: -38.9666, ddd: '75' },
  { municipio: 'Vitória da Conquista', uf: 'BA', lat: -14.8619, lng: -40.8444, ddd: '77' },
  { municipio: 'Camaçari', uf: 'BA', lat: -12.6967, lng: -38.3247, ddd: '71', coast: 'w' },
  { municipio: 'Ilhéus', uf: 'BA', lat: -14.7936, lng: -39.0458, ddd: '73', coast: 'w' },
  { municipio: 'Lauro de Freitas', uf: 'BA', lat: -12.8978, lng: -38.3214, ddd: '71', coast: 'w' },
  { municipio: 'Itabuna', uf: 'BA', lat: -14.7876, lng: -39.2803, ddd: '73', coast: 'w' },
  { municipio: 'Juazeiro', uf: 'BA', lat: -9.4167, lng: -40.5033, ddd: '74' },
  { municipio: 'Barreiras', uf: 'BA', lat: -12.1528, lng: -44.9936, ddd: '77' },
  { municipio: 'Teixeira de Freitas', uf: 'BA', lat: -17.5353, lng: -39.7419, ddd: '73', coast: 'w' },
  { municipio: 'Porto Seguro', uf: 'BA', lat: -16.4435, lng: -39.0647, ddd: '73', coast: 'w' },
  // ── PE ──
  { municipio: 'Recife', uf: 'PE', lat: -8.0476, lng: -34.8770, ddd: '81', coast: 'w' },
  { municipio: 'Jaboatão dos Guararapes', uf: 'PE', lat: -8.1130, lng: -35.0156, ddd: '81', coast: 'sw' },
  { municipio: 'Olinda', uf: 'PE', lat: -8.0089, lng: -34.8553, ddd: '81', coast: 'sw' },
  { municipio: 'Caruaru', uf: 'PE', lat: -8.2823, lng: -35.9761, ddd: '81' },
  { municipio: 'Petrolina', uf: 'PE', lat: -9.3891, lng: -40.5028, ddd: '87' },
  { municipio: 'Garanhuns', uf: 'PE', lat: -8.8828, lng: -36.4964, ddd: '87' },
  { municipio: 'Cabo de Santo Agostinho', uf: 'PE', lat: -8.2867, lng: -35.0286, ddd: '81', coast: 'w' },
  // ── CE ──
  { municipio: 'Fortaleza', uf: 'CE', lat: -3.7172, lng: -38.5433, ddd: '85', coast: 'sw' },
  { municipio: 'Caucaia', uf: 'CE', lat: -3.7361, lng: -38.6531, ddd: '85', coast: 's' },
  { municipio: 'Juazeiro do Norte', uf: 'CE', lat: -7.2131, lng: -39.3153, ddd: '88' },
  { municipio: 'Maracanaú', uf: 'CE', lat: -3.8720, lng: -38.6253, ddd: '85' },
  { municipio: 'Sobral', uf: 'CE', lat: -3.6861, lng: -40.3481, ddd: '88' },
  { municipio: 'Crato', uf: 'CE', lat: -7.2342, lng: -39.4078, ddd: '88' },
  // ── PA ──
  { municipio: 'Belém', uf: 'PA', lat: -1.4558, lng: -48.5024, ddd: '91', coast: 's' },
  { municipio: 'Ananindeua', uf: 'PA', lat: -1.3659, lng: -48.3886, ddd: '91', coast: 's' },
  { municipio: 'Santarém', uf: 'PA', lat: -2.4426, lng: -54.7080, ddd: '93' },
  { municipio: 'Marabá', uf: 'PA', lat: -5.3686, lng: -49.1178, ddd: '94' },
  { municipio: 'Parauapebas', uf: 'PA', lat: -6.0681, lng: -49.9018, ddd: '94' },
  // ── AM ──
  { municipio: 'Manaus', uf: 'AM', lat: -3.1190, lng: -60.0217, ddd: '92', coast: 'n' },
  { municipio: 'Parintins', uf: 'AM', lat: -2.6284, lng: -56.7353, ddd: '92' },
  // ── RN ──
  { municipio: 'Natal', uf: 'RN', lat: -5.7945, lng: -35.2110, ddd: '84', coast: 'sw' },
  { municipio: 'Mossoró', uf: 'RN', lat: -5.1878, lng: -37.3442, ddd: '84' },
  { municipio: 'Parnamirim', uf: 'RN', lat: -5.9155, lng: -35.2628, ddd: '84', coast: 'sw' },
  // ── PB ──
  { municipio: 'João Pessoa', uf: 'PB', lat: -7.1195, lng: -34.8450, ddd: '83', coast: 'w' },
  { municipio: 'Campina Grande', uf: 'PB', lat: -7.2306, lng: -35.8811, ddd: '83' },
  { municipio: 'Patos', uf: 'PB', lat: -7.0244, lng: -37.2747, ddd: '83' },
  // ── AL ──
  { municipio: 'Maceió', uf: 'AL', lat: -9.6658, lng: -35.7353, ddd: '82', coast: 'w' },
  { municipio: 'Arapiraca', uf: 'AL', lat: -9.7522, lng: -36.6611, ddd: '82' },
  // ── SE ──
  { municipio: 'Aracaju', uf: 'SE', lat: -10.9111, lng: -37.0717, ddd: '79', coast: 'w' },
  // ── MA ──
  { municipio: 'São Luís', uf: 'MA', lat: -2.5297, lng: -44.2825, ddd: '98', coast: 's' },
  { municipio: 'Imperatriz', uf: 'MA', lat: -5.5188, lng: -47.4736, ddd: '99' },
  { municipio: 'Caxias', uf: 'MA', lat: -4.8583, lng: -43.3558, ddd: '99' },
  // ── PI ──
  { municipio: 'Teresina', uf: 'PI', lat: -5.0892, lng: -42.8019, ddd: '86' },
  { municipio: 'Parnaíba', uf: 'PI', lat: -2.9047, lng: -41.7767, ddd: '86', coast: 's' },
  // ── MT ──
  { municipio: 'Cuiabá', uf: 'MT', lat: -15.6014, lng: -56.0979, ddd: '65' },
  { municipio: 'Várzea Grande', uf: 'MT', lat: -15.6469, lng: -56.1322, ddd: '65' },
  { municipio: 'Rondonópolis', uf: 'MT', lat: -16.4673, lng: -54.6372, ddd: '66' },
  { municipio: 'Sinop', uf: 'MT', lat: -11.8642, lng: -55.5066, ddd: '66' },
  { municipio: 'Tangará da Serra', uf: 'MT', lat: -14.6229, lng: -57.4986, ddd: '65' },
  { municipio: 'Sorriso', uf: 'MT', lat: -12.5428, lng: -55.7111, ddd: '66' },
  // ── MS ──
  { municipio: 'Campo Grande', uf: 'MS', lat: -20.4697, lng: -54.6201, ddd: '67' },
  { municipio: 'Dourados', uf: 'MS', lat: -22.2231, lng: -54.8118, ddd: '67' },
  { municipio: 'Três Lagoas', uf: 'MS', lat: -20.7511, lng: -51.6783, ddd: '67' },
  { municipio: 'Corumbá', uf: 'MS', lat: -19.0092, lng: -57.6513, ddd: '67' },
  // ── ES ──
  { municipio: 'Vitória', uf: 'ES', lat: -20.3155, lng: -40.3128, ddd: '27', coast: 'w' },
  { municipio: 'Vila Velha', uf: 'ES', lat: -20.3297, lng: -40.2925, ddd: '27', coast: 'w' },
  { municipio: 'Serra', uf: 'ES', lat: -20.1209, lng: -40.3075, ddd: '27', coast: 'w' },
  { municipio: 'Cariacica', uf: 'ES', lat: -20.2635, lng: -40.4164, ddd: '27' },
  { municipio: 'Cachoeiro de Itapemirim', uf: 'ES', lat: -20.8489, lng: -41.1128, ddd: '28' },
  { municipio: 'Linhares', uf: 'ES', lat: -19.3911, lng: -40.0722, ddd: '27' },
  { municipio: 'Colatina', uf: 'ES', lat: -19.5383, lng: -40.6308, ddd: '27' },
  // ── TO ──
  { municipio: 'Palmas', uf: 'TO', lat: -10.1689, lng: -48.3317, ddd: '63' },
  { municipio: 'Araguaína', uf: 'TO', lat: -7.1911, lng: -48.2069, ddd: '63' },
  { municipio: 'Gurupi', uf: 'TO', lat: -11.7297, lng: -49.0686, ddd: '63' },
  // ── RO ──
  { municipio: 'Porto Velho', uf: 'RO', lat: -8.7612, lng: -63.9004, ddd: '69' },
  { municipio: 'Ji-Paraná', uf: 'RO', lat: -10.8853, lng: -61.9514, ddd: '69' },
  // ── AC ──
  { municipio: 'Rio Branco', uf: 'AC', lat: -9.9754, lng: -67.8249, ddd: '68' },
  // ── AP ──
  { municipio: 'Macapá', uf: 'AP', lat: 0.0349, lng: -51.0694, ddd: '96', coast: 'w' },
  // ── RR ──
  { municipio: 'Boa Vista', uf: 'RR', lat: 2.8195, lng: -60.6714, ddd: '95' },
]

const SEGMENTOS = [
  'Tecnologia', 'Saúde', 'Varejo', 'Educação', 'Alimentação',
  'Indústria', 'Construção Civil', 'Serviços Financeiros', 'Logística',
  'Consultoria', 'Marketing', 'Agronegócio',
]

const CNAE_MAP: { segmento: string; cnaes: { codigo: string; descricao: string }[] }[] = [
  { segmento: 'Tecnologia', cnaes: [
    { codigo: '6201-5/00', descricao: 'Desenvolvimento de programas de computador sob encomenda' },
    { codigo: '6202-3/00', descricao: 'Desenvolvimento e licenciamento de programas customizáveis' },
    { codigo: '6203-1/00', descricao: 'Desenvolvimento e licenciamento de programas não-customizáveis' },
    { codigo: '6204-0/00', descricao: 'Consultoria em tecnologia da informação' },
    { codigo: '6209-1/00', descricao: 'Suporte técnico, manutenção e outros serviços em TI' },
  ]},
  { segmento: 'Saúde', cnaes: [
    { codigo: '8630-5/01', descricao: 'Atividade médica ambulatorial' },
    { codigo: '8630-5/02', descricao: 'Atividade médica ambulatorial com exames' },
  ]},
  { segmento: 'Varejo', cnaes: [
    { codigo: '4711-3/02', descricao: 'Comércio varejista de mercadorias em geral' },
    { codigo: '4751-2/00', descricao: 'Comércio varejista de equipamentos de informática' },
    { codigo: '4752-1/00', descricao: 'Comércio varejista de equipamentos de telefonia' },
  ]},
  { segmento: 'Educação', cnaes: [
    { codigo: '8599-6/04', descricao: 'Treinamento em desenvolvimento profissional' },
    { codigo: '8511-2/00', descricao: 'Educação infantil - creche' },
    { codigo: '8512-1/00', descricao: 'Educação infantil - pré-escola' },
  ]},
  { segmento: 'Alimentação', cnaes: [
    { codigo: '5611-2/01', descricao: 'Restaurantes e similares' },
    { codigo: '5611-2/03', descricao: 'Lanchonetes, casas de chá, de sucos e similares' },
  ]},
  { segmento: 'Indústria', cnaes: [
    { codigo: '1011-2/01', descricao: 'Frigorífico - abate de bovinos' },
    { codigo: '2211-1/00', descricao: 'Fabricação de pneumáticos e câmaras-de-ar' },
  ]},
  { segmento: 'Construção Civil', cnaes: [
    { codigo: '4120-4/00', descricao: 'Construção de edifícios' },
    { codigo: '4211-1/01', descricao: 'Construção de rodovias e ferrovias' },
  ]},
  { segmento: 'Serviços Financeiros', cnaes: [
    { codigo: '6422-1/00', descricao: 'Bancos múltiplos com carteira comercial' },
    { codigo: '6499-9/99', descricao: 'Outras atividades de serviços financeiros' },
  ]},
  { segmento: 'Logística', cnaes: [
    { codigo: '4930-2/02', descricao: 'Transporte rodoviário de carga' },
    { codigo: '5211-7/99', descricao: 'Depósitos de mercadorias para terceiros' },
  ]},
  { segmento: 'Consultoria', cnaes: [
    { codigo: '7020-4/00', descricao: 'Atividades de consultoria em gestão empresarial' },
    { codigo: '6920-6/01', descricao: 'Atividades de contabilidade' },
  ]},
  { segmento: 'Marketing', cnaes: [
    { codigo: '7311-4/00', descricao: 'Agências de publicidade' },
    { codigo: '7312-2/00', descricao: 'Agenciamento de espaços para publicidade' },
  ]},
  { segmento: 'Agronegócio', cnaes: [
    { codigo: '0111-3/01', descricao: 'Cultivo de arroz' },
    { codigo: '0115-6/00', descricao: 'Cultivo de soja' },
  ]},
]

const NOME_PREFIXOS = [
  'Tech', 'Data', 'Smart', 'Global', 'Prime', 'Ultra', 'Mega', 'Super', 'Neo', 'Max',
  'Pro', 'Top', 'Elite', 'Alpha', 'Beta', 'Nova', 'Eco', 'Bio', 'Net', 'Link',
  'Fast', 'Multi', 'Inter', 'Trans', 'Auto', 'Info', 'Digi', 'Web', 'Cloud', 'Flex',
]

const NOME_SUFIXOS: Record<string, string[]> = {
  'Tecnologia': ['Solutions', 'Systems', 'Tech', 'Digital', 'Software', 'Labs', 'Code', 'Dev', 'IT', 'Dados'],
  'Saúde': ['Clínica', 'Saúde', 'Med', 'Vida', 'Care', 'Pharma', 'Diagnóstico', 'Bem Estar', 'Ortho', 'Dental'],
  'Varejo': ['Store', 'Shop', 'Comércio', 'Loja', 'Outlet', 'Bazar', 'Empório', 'Magazine', 'Center', 'Express'],
  'Educação': ['Ensino', 'Educação', 'Academy', 'Escola', 'Instituto', 'Learning', 'Saber', 'Conhecimento', 'Cursos', 'Treinamento'],
  'Alimentação': ['Grill', 'Sabor', 'Gourmet', 'Food', 'Cozinha', 'Bistrô', 'Café', 'Lanches', 'Pizzaria', 'Padaria'],
  'Indústria': ['Industrial', 'Fabricação', 'Manufatura', 'Produção', 'Metal', 'Plásticos', 'Química', 'Têxtil', 'Mecânica', 'Fundição'],
  'Construção Civil': ['Construções', 'Engenharia', 'Obras', 'Edificações', 'Estruturas', 'Projetos', 'Empreendimentos', 'Incorporadora', 'Terraplanagem', 'Alvenaria'],
  'Serviços Financeiros': ['Capital', 'Finanças', 'Invest', 'Crédito', 'Banking', 'Seguros', 'Patrimônio', 'Gestão', 'Ativos', 'Wealth'],
  'Logística': ['Transportes', 'Logística', 'Cargo', 'Express', 'Frete', 'Entregas', 'Distribuição', 'Armazéns', 'Supply', 'Rotas'],
  'Consultoria': ['Consulting', 'Assessoria', 'Advisory', 'Partners', 'Gestão', 'Estratégia', 'Soluções', 'Planejamento', 'Negócios', 'Resultados'],
  'Marketing': ['Agency', 'Mídia', 'Propaganda', 'Criativa', 'Brands', 'Comunicação', 'Design', 'Studio', 'Creative', 'Publicidade'],
  'Agronegócio': ['Agro', 'Rural', 'Campo', 'Grãos', 'Sementes', 'Pecuária', 'Fazenda', 'Agrícola', 'Terra', 'Colheita'],
}

const RUAS = [
  'Av. Paulista', 'Rua Augusta', 'Av. Faria Lima', 'Rua Oscar Freire', 'Av. Brasil',
  'Rua da Consolação', 'Av. Rebouças', 'Rua Vergueiro', 'Av. Brigadeiro', 'Rua Liberdade',
  'Av. Santos Dumont', 'Rua XV de Novembro', 'Av. Getúlio Vargas', 'Rua Sete de Setembro',
  'Av. Presidente Vargas', 'Rua Tiradentes', 'Av. Rio Branco', 'Rua Marechal Deodoro',
  'Av. Beira Mar', 'Rua Dom Pedro II', 'Av. Independência', 'Rua São José',
  'Av. Principal', 'Rua do Comércio', 'Av. Central', 'Rua das Flores',
  'Av. JK', 'Rua Minas Gerais', 'Av. Goiás', 'Rua Bahia',
]

const FAIXAS_FUNC = ['1-5', '5-10', '10-20', '20-50', '50-100', '100-250', '250-500', '500+']
const FAIXAS_FAT = [
  'Até R$ 100K', 'R$ 100K - R$ 200K', 'R$ 200K - R$ 500K', 'R$ 500K - R$ 1M',
  'R$ 1M - R$ 5M', 'R$ 5M - R$ 10M', 'R$ 10M - R$ 50M', 'R$ 50M+',
]

// ─── Gerador determinístico (sem Math.random) ──────────────────────

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

function pickFromArray<T>(arr: T[], seed: number): T {
  return arr[Math.floor(seededRandom(seed) * arr.length)]
}

function formatCnpj(n: number): string {
  const s = String(n).padStart(14, '0')
  return `${s.slice(0,2)}.${s.slice(2,5)}.${s.slice(5,8)}/${s.slice(8,12)}-${s.slice(12,14)}`
}

function formatCep(seed: number): string {
  const n = Math.floor(seededRandom(seed) * 90000 + 10000)
  return `${String(Math.floor(n / 10)).padStart(5, '0')}-${String(n % 1000).padStart(3, '0')}`
}

function generateCompanies(count: number): Company[] {
  const companies: Company[] = []

  for (let i = 0; i < count; i++) {
    const id = String(i + 1)
    const seed = i + 1

    // Cidade - distribuição uniforme por todas as cidades
    const cityIndex = Math.floor(seededRandom(seed * 7) * CITIES.length)
    const city = CITIES[cityIndex]

    // Variação de coordenadas dentro da cidade (~3km de raio)
    let latOffset = (seededRandom(seed * 3) - 0.5) * 0.06
    let lngOffset = (seededRandom(seed * 5) - 0.5) * 0.06

    // Para cidades litorâneas, empurra offset para o interior
    if (city.coast) {
      const c = city.coast
      if (c.includes('n')) latOffset = Math.abs(latOffset) // empurra norte (lat mais positivo)
      if (c.includes('s')) latOffset = -Math.abs(latOffset) // empurra sul
      if (c.includes('w')) lngOffset = -Math.abs(lngOffset) // empurra oeste (interior)
      if (c.includes('e')) lngOffset = Math.abs(lngOffset) // empurra leste
    }

    // Segmento e CNAE
    const segmento = pickFromArray(SEGMENTOS, seed * 11)
    const cnaeGroup = CNAE_MAP.find(c => c.segmento === segmento) || CNAE_MAP[0]
    const cnae = pickFromArray(cnaeGroup.cnaes, seed * 13)

    // Nome
    const prefix = pickFromArray(NOME_PREFIXOS, seed * 17)
    const suffixes = NOME_SUFIXOS[segmento] || NOME_SUFIXOS['Tecnologia']
    const suffix = pickFromArray(suffixes, seed * 19)
    const nomeFantasia = `${prefix} ${suffix}`

    // Endereço
    const rua = pickFromArray(RUAS, seed * 23)
    const numero = Math.floor(seededRandom(seed * 29) * 9000 + 100)

    // Telefones
    const telefones: Company['telefones'] = [
      { numero: `(${city.ddd}) ${Math.floor(seededRandom(seed * 31) * 9000 + 1000)}-${Math.floor(seededRandom(seed * 37) * 9000 + 1000)}`, tipo: 'FIXO' },
    ]
    if (seededRandom(seed * 41) > 0.4) {
      telefones.push({
        numero: `(${city.ddd}) 9${Math.floor(seededRandom(seed * 43) * 9000 + 1000)}-${Math.floor(seededRandom(seed * 47) * 9000 + 1000)}`,
        tipo: 'MOVEL',
        whatsapp: seededRandom(seed * 53) > 0.3,
      })
    }

    // Email
    const emailDomain = `${prefix.toLowerCase()}${suffix.toLowerCase().replace(/[^a-z]/g, '')}.com.br`
    const validacao = seededRandom(seed * 59) > 0.3 ? 'ENTREGAVEL' as const : 'NAO_VERIFICADO' as const

    companies.push({
      id,
      cnpj: formatCnpj(10000000000000 + i * 7919), // primos para variar
      nome_fantasia: nomeFantasia,
      razao_social: `${nomeFantasia} Ltda`,
      segmento,
      cnae_codigo: cnae.codigo,
      cnae_descricao: cnae.descricao,
      latitude: city.lat + latOffset,
      longitude: city.lng + lngOffset,
      endereco: `${rua}, ${numero}`,
      municipio: city.municipio,
      uf: city.uf,
      cep: formatCep(seed * 67),
      telefones,
      emails: [{ email: `contato@${emailDomain}`, validacao }],
      faixa_funcionarios: pickFromArray(FAIXAS_FUNC, seed * 71),
      faixa_faturamento: pickFromArray(FAIXAS_FAT, seed * 73),
      is_enriched: false,
    })
  }

  return companies
}

export const MOCK_COMPANIES: Company[] = generateCompanies(2000)
