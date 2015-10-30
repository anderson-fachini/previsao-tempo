var app = angular.module('previsaoTempo', []);

app.controller('PrevisaoTempo', ['$http', '$scope', function ($http, $scope) {
	$scope.previsoes = [];
	$scope.temperaturaPeriodo = {
		maxima: 0,
		minima: 0
	};
	$scope.recomendacaoPraia = {
		img: '',
		menesagem: '',
		recomenda: false
	};
	$scope.variacaoTemperatura = [];
	$scope.geolocation = 'geolocation' in navigator;
	$scope.localFavorito = getLocalStorage().localFavorito;

	$scope.localizeme = function() {
		navigator.geolocation.getCurrentPosition(function(posicao) {
			$('.overlay').show();

	    	var latitude = posicao.coords.latitude;
	    	var longitude = posicao.coords.longitude;

	    	$http
			.get('http://nominatim.openstreetmap.org/reverse?lat=' + latitude + '&lon=' + longitude)
			.success(function (data) {
				var xmlDoc = $.parseXML(data);
				var cidade = $(xmlDoc).find('city').text();
				var estado = $(xmlDoc).find('state').text();

				estado = getEstadoByName(estado);

				setComboCidadeEstado(cidade, estado);
				getPrevisao(cidade, estado);
			})
			.error(function (data) {
				showAlert('Atenção', 'Não foi possível determinar a sua localização');
	    		$('.overlay').hide();
			});
	    }, function(error) {
	    	showAlert('Atenção', 'Não foi possível obter a sua localização');
	    	$('.overlay').hide();
	    });
	};

	$scope.setLocalFavorito = function() {
		var storage = {
			cidade: $('#cidade').val(),
			estado: $('#estado').val(),
			previsoes: $scope.previsoes,
			localFavorito: true
		};

		setLocalStorage(storage);

		$scope.localFavorito = true;
	};

	function showAlert(title, message) {
		var html = '<div class="alert alert-warning alert-dismissible"> \
		                <button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button> \
		                <h4><i class="icon fa fa-warning"></i> #TITLE</h4> \
		                #MESSAGE \
		            </div>';

		$('#alert').append( html.replace('#TITLE', title).replace('#MESSAGE', message) );            
	}

	function getEstadoByName(name) {
		var estados = $('#estado option');
		var len = estados.length;

		for (var i = 1; i < len; i++) {
			if ( $(estados[i]).text() === name ) {
				return $(estados[i]).val();
			}
		}
	}

	function setMaximaMinima(previsoes) {
		$scope.temperaturaPeriodo.minima = parseFloat(previsoes[0].temperatura_min);

		$scope.temperaturaPeriodo.maxima = parseFloat(previsoes[0].temperatura_max);

		var temp = 0;
		var qtd = previsoes.length;

		for (var i = 1; i < qtd; i++) {
			temp = parseFloat(previsoes[i].temperatura_min);
			if (temp < $scope.temperaturaPeriodo.minima) {
				$scope.temperaturaPeriodo.minima = temp;
			}

			temp = parseFloat(previsoes[i].temperatura_max);
			if (temp > $scope.temperaturaPeriodo.maxima) {
				$scope.temperaturaPeriodo.maxima = temp;
			}
		}
	}

	function setVariacaoTemperatura(previsoes) {
		var qtd = previsoes.length;

		for (var i = 0; i < qtd; i++) {
			$scope.variacaoTemperatura.push({
				dia: previsoes[i].data,
				max: previsoes[i].temperatura_max,
				min: previsoes[i].temperatura_min
			});
		}
	}

	function geraGrafico(previsoes) {
		var data = {
			labels: [],
			datasets: [
				{
					fillColor: "rgba(220,220,220,0.2)",
		            strokeColor: "rgba(220,220,220,1)",
					data: []
				},
				{
					fillColor: "rgba(151,187,205,0.2)",
            		strokeColor: "rgba(151,187,205,1)",
					data: []
				}
			]
		};

		var options = {
			scaleStartValue: $scope.temperaturaPeriodo.minima - (($scope.temperaturaPeriodo.maxima - $scope.temperaturaPeriodo.minima) / 2),
			scaleStepWidth: 2,
			scaleSteps: (($scope.temperaturaPeriodo.maxima - $scope.temperaturaPeriodo.minima) / 2) + 2,
			scaleOverride: true,
			responsive: true
		};

		var len = previsoes.length;
		for (var i = 0; i < len; i++) {
			data.labels.push(previsoes[i].data.split(' - ')[0]);
			data.datasets[0].data.push(previsoes[i].temperatura_max);
			data.datasets[1].data.push(previsoes[i].temperatura_min);
		}

		var ctx = $("#grafico-variacao").get(0).getContext("2d");
		var myNewChart = new Chart(ctx).Line(data, options);
	}

	function setRecomendacaoPraia(previsoes) {
		var len = previsoes.length;
		var tempSab = 0, tempDom = 0;
		var data, temp;

		var recomenda = false;

		for (var i = 0; i < len; i++) {
			data = previsoes[i].data.split(' - ')[0];

			if (data === 'Sábado') {
				tempSab = parseFloat(previsoes[i].temperatura_max);
			} else if (data == 'Domingo') {
				tempDom = parseFloat(previsoes[i].temperatura_max);
			}
		}

		if ( tempSab > 0 || tempDom > 0 ) {
			if ((tempSab > 25 && (tempDom === 0 || tempDom > 25)) ||
				(tempDom > 25 && (tempSab === 0 || tempSab > 25)) ) {
				
				recomenda = true;
			}
		} else if (parseFloat(previsoes[len-1].temperatura_max) > 25) {
			recomenda = true;
		}


		$scope.recomendacaoPraia.img = recomenda ? 'images/go-beach.jpg' : 'images/no-beach.jpg';
		$scope.recomendacaoPraia.mensagem = recomenda ? 'Que tal uma praia neste final de semana?' : 'Este final de semana não vai dar praia';
		$scope.recomendacaoPraia.recomenda = recomenda;
	}

	function geraInformacoes(previsoes) {
		$scope.previsoes = previsoes;
		setMaximaMinima(previsoes);
		setVariacaoTemperatura(previsoes);
		setRecomendacaoPraia(previsoes);
		geraGrafico(previsoes);

		$('.overlay').hide();
	}

	function getPrevisao(cidade, estado, salvaResultado) {
		$('.overlay').show();

		$http
		.get('http://developers.agenciaideias.com.br/tempo/json/' + cidade + '-' + estado)
		.success(function (data) {
			var previsoes = data.previsoes.slice(1);

			geraInformacoes(previsoes);

			if (salvaResultado || $scope.localFavorito) {
				var storage = getLocalStorage();
				storage.previsoes = previsoes;

				setLocalStorage(storage);
			}
		})
		.error(function (data) {
			showAlert('Atenção', 'Não foi possível obter a previsão');
	    	$('.overlay').hide();
		});
	}

	function getLocalStorage() {
		var storage = localStorage.getItem('previsaoTempo');

		if (storage) {
			return JSON.parse(storage);
		} else {
			storage = {
				cidade: 'Blumenau',
				estado: 'SC',
				previsoes: [],
				localFavorito: false
			};

			setLocalStorage(storage);

			return storage;
		}
	}

	function setLocalStorage(storage) {
		localStorage.setItem('previsaoTempo', JSON.stringify(storage));
	}

	function setComboCidadeEstado(cidade, estado) {
		new dgCidadesEstados({
	        cidade: $('#cidade')[0],
	        estado: $('#estado')[0],
	        estadoVal: estado,
	        cidadeVal: cidade
	    });

	    $('#cidade, #estado').select2();
	}

	var storage = getLocalStorage();

	if (storage.previsoes.length) {
		var dataPrimeiraPrevisao = storage.previsoes[0].data.split(' - ')[1];
		var dataHoje = moment().add(1, 'days').format('DD/MM/YYYY');

		if (dataPrimeiraPrevisao === dataHoje) {
			geraInformacoes(storage.previsoes);	
		} else {
			getPrevisao(storage.cidade, storage.estado);
		}		
	} else {
		var salvaResultado = true;
		getPrevisao('Blumenau', 'SC', salvaResultado);
	}

	setComboCidadeEstado(storage.cidade, storage.estado);	

	$('#cidade').change(function(e) {
		var estado = $('#estado').val();
		var cidade = $(this).val();

		getPrevisao(estado, cidade);

		var storage = getLocalStorage();

		if (storage.cidade === cidade && storage.estado === estado) {
			$scope.localFavorito = true;
		} else {
			$scope.localFavorito = false;
		}
	});
}]);