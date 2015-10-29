var app = angular.module('previsaoTempo', []);

app.controller('PrevisaoTempo', ['$http', '$scope', function ($http, $scope) {
	$scope.previsoes = [];
	$scope.temperaturaPeriodo = {
		maxima: {
			dia: 0,
			temperatura: 0
		},
		minima: {
			dia: 0,
			temperatura: 0
		}
	};
	$scope.recomendacaoPraia = '';
	$scope.variacaoTemperatura = [];

	function setMaximaMinima(previsoes) {
		$scope.temperaturaPeriodo.minima.dia = previsoes[0].data;
		$scope.temperaturaPeriodo.minima.temperatura = parseFloat(previsoes[0].temperatura_min);

		$scope.temperaturaPeriodo.maxima.dia = previsoes[0].data;
		$scope.temperaturaPeriodo.maxima.temperatura = parseFloat(previsoes[0].temperatura_max);

		var temp = 0;
		var qtd = previsoes.length;

		for (var i = 1; i < qtd; i++) {
			temp = parseFloat(previsoes[i].temperatura_min);
			if (temp > $scope.temperaturaPeriodo.minima.temperatura) {
				$scope.temperaturaPeriodo.minima.temperatura = temp;
				$scope.temperaturaPeriodo.minima.dia = previsoes[i].data;
			}

			temp = parseFloat(previsoes[i].temperatura_max);
			if (temp > $scope.temperaturaPeriodo.maxima.temperatura) {
				$scope.temperaturaPeriodo.maxima.temperatura = temp;
				$scope.temperaturaPeriodo.maxima.dia = previsoes[i].data;
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
			scaleStartValue: $scope.temperaturaPeriodo.minima.temperatura - (($scope.temperaturaPeriodo.maxima.temperatura - $scope.temperaturaPeriodo.minima.temperatura) / 2),
			scaleStepWidth: 2,
			scaleSteps: (($scope.temperaturaPeriodo.maxima.temperatura - $scope.temperaturaPeriodo.minima.temperatura) / 2) + 2,
			scaleOverride: true,
			responsive: true
		};

		console.log(options);

		var len = previsoes.length;
		for (var i = 0; i < len; i++) {
			data.labels.push(previsoes[i].data.split(' - ')[0]);
			data.datasets[0].data.push(previsoes[i].temperatura_max);
			data.datasets[1].data.push(previsoes[i].temperatura_min);
		}

		var ctx = $("#grafico-variacao").get(0).getContext("2d");
		var myNewChart = new Chart(ctx).Line(data, options);
	}

	$http
		.get('http://developers.agenciaideias.com.br/tempo/json/Blumenau-SC')
		.success(function (data) {
			var previsoes = data.previsoes.slice(1);

			$scope.previsoes = previsoes;
			setMaximaMinima(previsoes);
			setVariacaoTemperatura(previsoes);
			geraGrafico(previsoes);
		})
		.error(function (data) {

		});
}]);