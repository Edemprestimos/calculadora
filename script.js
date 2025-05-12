document.addEventListener('DOMContentLoaded', function() {
    const etapas = document.querySelectorAll('.etapa');
    const btnEtapa1 = document.getElementById('btn-ir-para-etapa2');
    const btnEtapa2Voltar = document.getElementById('btn-voltar-para-etapa1');
    const btnEtapa2 = document.getElementById('btn-ir-para-etapa3');
    const btnEtapa3Voltar = document.getElementById('btn-voltar-para-etapa2');
    const btnEtapa3 = document.getElementById('btn-ir-para-etapa4');
    const btnEtapa4Voltar = document.getElementById('btn-voltar-para-etapa3');
    const btnCompartilhar = document.getElementById('btn-compartilhar');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    
    const campoDataAtual = document.getElementById('data-atual');

    let etapaAtual = 1;
    const dadosEmprestimo = {
        cliente: {
            nome: '',
            cpf: '',
            dataEmprestimo: null,
            dataPrimeiraParcela: null
        },
        valor: {
            faixa: '',
            solicitado: 0,
            minimo: 0,
            maximo: 0
        },
        parcelas: {
            quantidade: 0,
            valorParcela: 0,
            dataUltimaParcela: null,
            totalComJuros: 0 
        }
    };

    // Theme switcher logic
    const currentTheme = localStorage.getItem('theme') ? localStorage.getItem('theme') : null;
    const themeIcon = themeToggleBtn.querySelector('i');
    const themeBtnText = themeToggleBtn.querySelector('.theme-btn-text');

    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (themeIcon) themeIcon.classList.remove('fa-moon');
        if (themeIcon) themeIcon.classList.add('fa-sun');
        if(themeBtnText) themeBtnText.textContent = "Modo Claro";
    }

    themeToggleBtn.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        let theme = 'light';
        if (document.body.classList.contains('dark-mode')) {
            theme = 'dark';
            if (themeIcon) themeIcon.classList.remove('fa-moon');
            if (themeIcon) themeIcon.classList.add('fa-sun');
            if(themeBtnText) themeBtnText.textContent = "Modo Claro";
        } else {
            if (themeIcon) themeIcon.classList.remove('fa-sun');
            if (themeIcon) themeIcon.classList.add('fa-moon');
            if(themeBtnText) themeBtnText.textContent = "Modo Escuro";
        }
        localStorage.setItem('theme', theme);
    });
    
    document.getElementById('cpf').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 3) value = value.replace(/^(\d{3})/, '$1.');
        if (value.length > 7) value = value.replace(/^(\d{3})\.(\d{3})/, '$1.$2.');
        if (value.length > 11) value = value.replace(/^(\d{3})\.(\d{3})\.(\d{3})/, '$1.$2.$3-');
        e.target.value = value.substring(0, 14);
    });
    
    document.getElementById('valor-emprestimo').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
         if (value === '') { e.target.value = ''; return; }
        value = (parseInt(value, 10) / 100).toLocaleString('pt-BR', {
            minimumFractionDigits: 2, maximumFractionDigits: 2
        });
        if (value === 'NaN' || (value === '0,00' && e.target.value.replace(/\D/g, '').length > 0 && parseInt(e.target.value.replace(/\D/g, ''), 10) === 0)) {
             e.target.value = '0,00';
        } else if (value === 'NaN') {
             e.target.value = '';
        } else { e.target.value = value; }
    });

    const hoje = new Date();
    const hojeFormatado = hoje.toISOString().split('T')[0];
    campoDataAtual.value = hojeFormatado;
    dadosEmprestimo.cliente.dataEmprestimo = new Date(hojeFormatado + 'T00:00:00');
    popularDatasPrimeiraParcela(); 

    campoDataAtual.addEventListener('change', function() {
        if (this.value) {
            dadosEmprestimo.cliente.dataEmprestimo = new Date(this.value + 'T00:00:00');
            popularDatasPrimeiraParcela();
        } else {
            document.getElementById('data-primeira-parcela').innerHTML = '<option value="">Selecione a data</option>';
            dadosEmprestimo.cliente.dataEmprestimo = null;
        }
    });
    
    btnEtapa1.addEventListener('click', function() {
        const nome = document.getElementById('nome-completo').value.trim();
        const cpf = document.getElementById('cpf').value.trim();
        const dataEmprestimoStr = document.getElementById('data-atual').value;
        const dataPrimeiraParcelaStr = document.getElementById('data-primeira-parcela').value;
        
        if (nome === '') { alert('Por favor, informe o nome completo.'); return; }
        if (cpf.length !== 14) { alert('CPF deve estar no formato 000.000.000-00'); return; }
        if (!dataEmprestimoStr) { alert('Por favor, informe a data do empréstimo.'); return; }
        if (!dataPrimeiraParcelaStr) { alert('Por favor, selecione a data da primeira parcela.'); return; }
        
        dadosEmprestimo.cliente.nome = nome;
        dadosEmprestimo.cliente.cpf = cpf;
        dadosEmprestimo.cliente.dataEmprestimo = new Date(dataEmprestimoStr + 'T00:00:00');
        dadosEmprestimo.cliente.dataPrimeiraParcela = new Date(dataPrimeiraParcelaStr + 'T00:00:00');
        
        mostrarEtapa(2);
    });
    
    btnEtapa2Voltar.addEventListener('click', function() { mostrarEtapa(1); });
    
    btnEtapa2.addEventListener('click', function() {
        const faixaSelect = document.getElementById('faixa-valor');
        const faixaValorMax = parseFloat(faixaSelect.value);
        const valorInputStr = document.getElementById('valor-emprestimo').value.replace(/\./g, '').replace(',', '.');
        const valorSolicitado = parseFloat(valorInputStr);
        
        if (isNaN(valorSolicitado) || valorSolicitado <= 0) { alert('Por favor, insira um valor desejado válido.'); return; }
        
        let minimo = 0;
        if (faixaValorMax === 500) minimo = 0.01;
        else if (faixaValorMax === 1000) minimo = 500.01;
        else if (faixaValorMax === 1500) minimo = 1000.01;
        else if (faixaValorMax === 2000) minimo = 1500.01;
        else if (faixaValorMax === 2500) minimo = 2000.01;
        else if (faixaValorMax === 3000) minimo = 2500.01;
        else if (faixaValorMax === 5000) minimo = 3000.01;
        else if (faixaValorMax === 10000) minimo = 5000.01;
        
        if (valorSolicitado < minimo ) {
             if (faixaValorMax !== 10000) {
                alert(`O valor mínimo para esta faixa é de ${formatarMoeda(minimo)}`); return;
             }
        }
        
        if (valorSolicitado > faixaValorMax && faixaValorMax !== 10000) {
            alert(`O valor máximo para esta faixa é de ${formatarMoeda(faixaValorMax)}`); return;
        }
        
        dadosEmprestimo.valor.faixa = faixaSelect.options[faixaSelect.selectedIndex].text;
        dadosEmprestimo.valor.solicitado = valorSolicitado;
        dadosEmprestimo.valor.minimo = minimo;
        dadosEmprestimo.valor.maximo = (faixaValorMax === 10000) ? Infinity : faixaValorMax;
        
        prepararParcelamento();
        mostrarEtapa(3);
    });
    
    btnEtapa3Voltar.addEventListener('click', function() { mostrarEtapa(2); });
    
    btnEtapa3.addEventListener('click', function() {
        const parcelaSelecionada = document.querySelector('input[name="parcelas"]:checked');
        if (!parcelaSelecionada) { alert('Por favor, selecione o número de parcelas.'); return; }
        
        const parcelas = parseInt(parcelaSelecionada.value);
        const valorParcela = parseFloat(parcelaSelecionada.dataset.valor);
        const totalComJuros = parseFloat(parcelaSelecionada.dataset.total);
        
        const dataPrimeira = dadosEmprestimo.cliente.dataPrimeiraParcela;
        const dataUltima = adicionarMesesCorretamente(new Date(dataPrimeira), parcelas - 1);
        
        dadosEmprestimo.parcelas.quantidade = parcelas;
        dadosEmprestimo.parcelas.valorParcela = valorParcela;
        dadosEmprestimo.parcelas.totalComJuros = totalComJuros;
        dadosEmprestimo.parcelas.dataUltimaParcela = dataUltima;
        
        atualizarResumo();
        mostrarEtapa(4);
    });
    
    btnEtapa4Voltar.addEventListener('click', function() { mostrarEtapa(3); });
    
    btnCompartilhar.addEventListener('click', function() {
        const nomeCliente = dadosEmprestimo.cliente.nome;
        const cpfCliente = dadosEmprestimo.cliente.cpf;
        const dataEmp = dadosEmprestimo.cliente.dataEmprestimo.toLocaleDateString('pt-BR');
        const valorEmp = formatarMoeda(dadosEmprestimo.valor.solicitado);
        const numParcelas = dadosEmprestimo.parcelas.quantidade;
        const valParcela = formatarMoeda(dadosEmprestimo.parcelas.valorParcela);
        const dataPrimParcela = dadosEmprestimo.cliente.dataPrimeiraParcela.toLocaleDateString('pt-BR');
        const dataUltParcela = dadosEmprestimo.parcelas.dataUltimaParcela.toLocaleDateString('pt-BR');

        const mensagem = `*RESUMO DE EMPRÉSTIMO*\n\n` +
                         `*Nome:* ${nomeCliente}\n` +
                         `*CPF:* ${cpfCliente}\n` +
                         `*Data do Empréstimo:* ${dataEmp}\n` +
                         `*Valor do Empréstimo:* ${valorEmp}\n` +
                         `*Parcelas:* ${numParcelas}x de ${valParcela}\n` +
                         `*Data 1ª Parcela:* ${dataPrimParcela}\n` +
                         `*Data Última Parcela:* ${dataUltParcela}`;
        
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
        window.open(whatsappUrl, '_blank');
    });
    
    function mostrarEtapa(numero) {
        etapas.forEach(etapa => etapa.classList.remove('ativa'));
        document.getElementById(`etapa${numero}`).classList.add('ativa');
        etapaAtual = numero;
        atualizarBarraProgresso();
        if (numero === 3) { 
            atualizarOpacidadeParcelas();
        }
    }
    
    function atualizarBarraProgresso() {
        const steps = document.querySelectorAll('.progress-step');
        steps.forEach((step, index) => {
            if (index + 1 < etapaAtual) { step.classList.add('completed', 'active'); }
            else if (index + 1 === etapaAtual) { step.classList.add('active'); step.classList.remove('completed'); }
            else { step.classList.remove('active', 'completed'); }
        });
    }

    function popularDatasPrimeiraParcela() {
        const selectDataParcela = document.getElementById('data-primeira-parcela');
        const dataEmprestimoValue = document.getElementById('data-atual').value;

        const valorAnteriorSelecionado = selectDataParcela.value;
        selectDataParcela.innerHTML = '<option value="">Selecione a data</option>';

        if (!dataEmprestimoValue) return;

        const dataBaseEmprestimo = new Date(dataEmprestimoValue + 'T00:00:00');
        const dataMinimaParcela = new Date(dataBaseEmprestimo);
        dataMinimaParcela.setDate(dataMinimaParcela.getDate() + 1); 

        const dataMaximaParcela = new Date(dataBaseEmprestimo);
        dataMaximaParcela.setDate(dataMaximaParcela.getDate() + 33); 

        const diasFixosPreferidos = [5, 10, 15, 20, 25];
        let datasPossiveisSet = new Set();

        for (let i = 0; i <= 33; i++) {
            const dataCandidata = new Date(dataBaseEmprestimo);
            dataCandidata.setDate(dataBaseEmprestimo.getDate() + 1 + i);

            if (dataCandidata > dataMaximaParcela) break;
            if (dataCandidata < dataMinimaParcela) continue;

            const diaDoMes = dataCandidata.getDate();
            const ultimoDiaDoMesCandidato = new Date(dataCandidata.getFullYear(), dataCandidata.getMonth() + 1, 0).getDate();

            if (diasFixosPreferidos.includes(diaDoMes) || diaDoMes === ultimoDiaDoMesCandidato) {
                datasPossiveisSet.add(dataCandidata.toISOString().split('T')[0]);
            }
        }
        if (datasPossiveisSet.size < 5) { 
             for (let i = 1; i <= 33; i++) { 
                const dataIter = new Date(dataBaseEmprestimo);
                dataIter.setDate(dataBaseEmprestimo.getDate() + i);
                 if (dataIter >= dataMinimaParcela && dataIter <= dataMaximaParcela) {
                    datasPossiveisSet.add(dataIter.toISOString().split('T')[0]);
                }
                if(dataIter > dataMaximaParcela) break;
            }
        }

        const datasOrdenadas = Array.from(datasPossiveisSet)
                                    .map(str => new Date(str + 'T00:00:00'))
                                    .sort((a, b) => a - b)
                                    .filter(data => data >= dataMinimaParcela && data <= dataMaximaParcela); 
        
        const datasUnicasParaOption = [...new Map(datasOrdenadas.map(item => [item.toISOString().split('T')[0], item])).values()];

        datasUnicasParaOption.forEach(data => {
            const option = document.createElement('option');
            option.value = data.toISOString().split('T')[0];
            option.textContent = data.toLocaleDateString('pt-BR');
            selectDataParcela.appendChild(option);
        });

        if (valorAnteriorSelecionado && selectDataParcela.querySelector(`option[value="${valorAnteriorSelecionado}"]`)) {
            selectDataParcela.value = valorAnteriorSelecionado;
        }
    }
    
    function prepararParcelamento() {
        const container = document.getElementById('lista-parcelas');
        container.innerHTML = '';
        const valorPrincipal = dadosEmprestimo.valor.solicitado;
        
        const opcoesParcelamento = [];
        for (let i = 3; i <= 48; i += 3) { 
            opcoesParcelamento.push(i);
        }

        const minParcelas = 3;
        const maxParcelas = 48;
        // Taxas MENSAIS base
        const taxaMensalBaseInicial = 0.15; // 17% a.m. para 3x
        const taxaMensalBaseFinal = 0.10;   // 7% a.m. para 48x

        let colunaAtual = 0; // 0 para ímpar (verde), 1 para par (azul)

        opcoesParcelamento.forEach(numParcelas => {
            let taxaMensalInterpolada;
            if (maxParcelas === minParcelas) { 
                taxaMensalInterpolada = taxaMensalBaseInicial;
            } else {
                // Interpolação linear da TAXA MENSAL
                // A taxa diminui conforme o número de parcelas aumenta
                const slope = (taxaMensalBaseFinal - taxaMensalBaseInicial) / (maxParcelas - minParcelas);
                taxaMensalInterpolada = taxaMensalBaseInicial + slope * (numParcelas - minParcelas);
            }

            let valorParcelaCalculado;
            if (taxaMensalInterpolada <= 0) { 
                valorParcelaCalculado = valorPrincipal / numParcelas;
            } else {
                const i = taxaMensalInterpolada;
                const n = numParcelas;
                valorParcelaCalculado = valorPrincipal * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
            }
            
            const valorParcelaArredondado = Math.ceil(valorParcelaCalculado / 5) * 5;
            const valorTotalArredondado = valorParcelaArredondado * numParcelas;
            
            const divOption = document.createElement('div');
            divOption.classList.add('parcela-option');
            
            // Adiciona classe para estilização da coluna (par/ímpar)
            if (colunaAtual % 2 === 0) {
                divOption.classList.add('parcela-impar'); // Será estilizado como verde
            } else {
                divOption.classList.add('parcela-par'); // Será estilizado como azul
            }
            colunaAtual++;


            divOption.innerHTML = `
                <input type="radio" name="parcelas" id="parcela-${numParcelas}x" value="${numParcelas}" 
                       data-valor="${valorParcelaArredondado.toFixed(2)}" data-total="${valorTotalArredondado.toFixed(2)}">
                <label for="parcela-${numParcelas}x">${numParcelas}x ${formatarMoeda(valorParcelaArredondado)}</label>
            `;
            container.appendChild(divOption);
        });

        document.querySelectorAll('input[name="parcelas"]').forEach(radio => {
            radio.addEventListener('change', atualizarOpacidadeParcelas);
        });
        atualizarOpacidadeParcelas(); 
    }

    function atualizarOpacidadeParcelas() {
        const algumaSelecionada = document.querySelector('input[name="parcelas"]:checked');
        document.querySelectorAll('.parcela-option label').forEach(label => {
            const inputCorrespondente = document.getElementById(label.htmlFor);
            const estaSelecionada = inputCorrespondente && inputCorrespondente.checked;

            if (algumaSelecionada) {
                label.style.opacity = estaSelecionada ? '1' : '0.7';
            } else {
                label.style.opacity = '1'; 
            }
            label.onmouseover = function() { if (!estaSelecionada) this.style.opacity = '1'; };
            label.onmouseout = function() { 
                if (!estaSelecionada && algumaSelecionada) this.style.opacity = '0.7'; 
                else if (!estaSelecionada && !algumaSelecionada) this.style.opacity = '1';
            };
        });
    }
    
    function atualizarResumo() {
        document.getElementById('resumo-nome').textContent = dadosEmprestimo.cliente.nome;
        document.getElementById('resumo-cpf').textContent = dadosEmprestimo.cliente.cpf;
        document.getElementById('resumo-data-emprestimo').textContent = dadosEmprestimo.cliente.dataEmprestimo.toLocaleDateString('pt-BR');
        document.getElementById('resumo-valor').textContent = formatarMoeda(dadosEmprestimo.valor.solicitado);
        document.getElementById('resumo-parcelas').textContent = `${dadosEmprestimo.parcelas.quantidade}x`;
        document.getElementById('resumo-valor-parcela').textContent = formatarMoeda(dadosEmprestimo.parcelas.valorParcela);
        document.getElementById('resumo-data-primeira').textContent = dadosEmprestimo.cliente.dataPrimeiraParcela.toLocaleDateString('pt-BR');
        document.getElementById('resumo-data-ultima').textContent = dadosEmprestimo.parcelas.dataUltimaParcela.toLocaleDateString('pt-BR');
    }
    
    function formatarMoeda(valor) {
        if (typeof valor !== 'number' || isNaN(valor)) { return 'R$ 0,00'; }
        return 'R$ ' + valor.toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+\,)/g, '$1.');
    }

    function adicionarMesesCorretamente(dataInicial, meses) {
        const novaData = new Date(dataInicial.getTime());
        const diaOriginal = novaData.getDate();
        novaData.setMonth(novaData.getMonth() + meses);
        if (novaData.getDate() !== diaOriginal) { novaData.setDate(0); }
        return novaData;
    }
});