var app = angular.module('previsaoTempo', []);

app.controller('PrevisaoTempo', ['$http', '$scope', function ($http, $scope) {
	$scope.previsoes = [];
	$scope.temperaturaPeriodo = {
		maxima: 0,
		minima: 0
	};
	$scope.recomendacaoPraia = false;
	$scope.variacaoTemperatura = [];

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

		$scope.recomendacaoPraia = false;

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
				$scope.recomendacaoPraia = true;
			}
		} else if (parseFloat(previsoes[len-1].temperatura_max) > 25) {
			$scope.recomendacaoPraia = true;
		}
	}

	function getPrevisao(cidade, estado) {
		$('.overlay').show();

		$http
		.get('http://developers.agenciaideias.com.br/tempo/json/' + cidade + '-' + estado)
		.success(function (data) {
			var previsoes = data.previsoes.slice(1);

			$scope.previsoes = previsoes;
			setMaximaMinima(previsoes);
			setVariacaoTemperatura(previsoes);
			setRecomendacaoPraia(previsoes);
			geraGrafico(previsoes);

			$('.overlay').hide();
		})
		.error(function (data) {

		});
	}

	getPrevisao('Blumenau', 'SC');

	$('#cidade').change(function(e) {
		getPrevisao($('#estado').val(), $(this).val());
	});
}]);

$(document).ready(function() {
	new dgCidadesEstados({
        cidade: $('#cidade')[0],
        estado: $('#estado')[0],
        estadoVal: 'SC',
        cidadeVal: 'Blumenau'
    });

	$('#estado, #cidade').select2();
});