'use strict';

angular.module('webApp')
	.factory('Location', function ($q, $http) {
		// Service logic
		// ...
		var countries_dict_cache = null;
		var cities_dict_cache = {
			country_id: null,
			cities: null
		};
		var districts_dict_cache = {
			city_id: null,
			districts: null
		};
		var sub_districts_dict_cache = {
			district_id: null,
			sub_districts: null
		}
		var meaningOfLife = 42;

		var getCountries = function() {
			var defer = $q.defer();
			if(countries_dict_cache) defer.resolve(countries_dict_cache);
			$http.get('/api/locations/countries/')
			.then(function(result) {
				countries_dict_cache = result.data;
				defer.resolve(countries_dict_cache);
			}, function(err) {
				defer.reject(err);
			});
			return defer.promise;
		};

		var getCities = function(country_id) {
			var defer = $q.defer();
			if(cities_dict_cache.country_id == country_id) defer.resolve(cities_dict_cache);
			$http.get('/api/locations/cities/'+country_id)
			.then(function(result) {
				cities_dict_cache.cities = result.data;
				cities_dict_cache.country_id  = country_id;
				defer.resolve(cities_dict_cache);
			}, function(err) {
				defer.reject(err);
			});
			return defer.promise;
		};

		var getDistricts = function(city_id) {
			var defer = $q.defer();
			if(districts_dict_cache.city_id == city_id) defer.resolve(districts_dict_cache);
			$http.get('/api/locations/districts/'+city_id)
			.then(function(result) {
				districts_dict_cache.districts = result.data;
				districts_dict_cache.city_id  = city_id;
				defer.resolve(districts_dict_cache);
			}, function(err) {
				defer.reject(err);
			});
			return defer.promise;
		};

		var getSubDistricts = function(district_id) {
			var defer = $q.defer();
			if(sub_districts_dict_cache.district_id == district_id) defer.resolve(sub_districts_dict_cache);
			$http.get('/api/locations/sub_districts/'+district_id)
			.then(function(result) {
				sub_districts_dict_cache.sub_districts = result.data;
				sub_districts_dict_cache.district_id  = district_id;
				defer.resolve(sub_districts_dict_cache);
			}, function(err) {
				defer.reject(err);
			});
			return defer.promise;
		};

		var getAddress = function() {
			var defer = $q.defer();
			$http.get('/api/locations/customer/')
			.then(function(result) {
				defer.resolve(result.data[0]);
			}, function(err) {
				defer.reject(err);
			});
			return defer.promise;
		};

		var updateAddress = function(shipping_info) {
			var defer = $q.defer();
			var address_to_update = {
				firstname: shipping_info.firstname,
				lastname: '',
				company: shipping_info.company ? shipping_info.company : '',
				company_id: shipping_info.company_id ? shipping_info.company_id : '',
				address_1: shipping_info.address,
				address_2: '',
				city: '',
				postcode: (shipping_info.district_d) ? shipping_info.district_d.postcode : 0,
				telephone: shipping_info.telephone,
				country_id: shipping_info.country_id,   // 國家
				zone_id: shipping_info.city_id,			// 省份，上海市
				district_id: shipping_info.district_id, // 地級，上海市
				sub_district_id: shipping_info.sub_district_id // 縣市/直轄區，靜安區
			};
			$http.put('/api/locations/address/', {address: address_to_update})
			.then(function(result) {
				console.log('我結束updateAddress');
				defer.resolve(result);
			}, function(err) {
				defer.reject(err);
			});
			return defer.promise;
		};
		// Public API here
		return {
			someMethod: function () {
				return meaningOfLife;
			},
			getCountries: getCountries,
			getCities: getCities,
			getDistricts: getDistricts,
			getSubDistricts: getSubDistricts,
			getAddress: getAddress,
			updateAddress: updateAddress
		};
	});
