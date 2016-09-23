// offcanvas menu 
$(document).ready(function () {
		/*  Fix First Click Menu */
		$(document.body).on('click', '#pav-mainnav [data-toggle="dropdown"]' ,function(){
				if(!$(this).parent().hasClass('open') && this.href && this.href != '#'){
						window.location.href = this.href;
				}

		});

	// Search
	$('#search input[name=\'search\']').parent().find('button').on('click', function() {
		url = $('base').attr('href') + 'index.php?route=product/search';
		var value = $('#search input[name=\'search\']').val();
		if (value) {
			url += '&search=' + encodeURIComponent(value);
		}
		location = url;
	});
	$('#search input[name=\'search\']').on('keydown', function(e) {
		if (e.keyCode == 13) {
			$('#search input[name=\'search\']').parent().find('button').trigger('click');
		}
	});

		// Search offcanvas
	$('#offcanvas-search input[name=\'search\']').parent().find('button').on('click', function() {
		url = $('base').attr('href') + 'index.php?route=product/search';
		var value = $('#offcanvas-search input[name=\'search\']').val();
		if (value) {
			url += '&search=' + encodeURIComponent(value);
		}
		location = url;
	});
	$('#offcanvas-search input[name=\'search\']').on('keydown', function(e) {
		if (e.keyCode == 13) {
			$('#offcanvas-search input[name=\'search\']').parent().find('button').trigger('click');
		}
	});




	// Offcanvas
	$('[data-toggle="offcanvas"]').click(function () {
		$('.row-offcanvas').toggleClass('active')
	});
});


$(document).ready(function(){

		$('.dropdown-menu input').click(function(e) {
				e.stopPropagation();
		});

		// grid list switcher
		$("button.btn-switch").bind("click", function(e){
				e.preventDefault();
				var theid = $(this).attr("id");
				var row = $("#products");

				if($(this).hasClass("active")) {
						return false;
				} else {
						if(theid == "list-view"){
								$('#list-view').addClass("active");
								$('#grid-view').removeClass("active");

								// remove class list
								row.removeClass('product-grid');
								// add class gird
								row.addClass('product-list');
								
						}else if(theid =="grid-view"){
								$('#grid-view').addClass("active");
								$('#list-view').removeClass("active");

								// remove class list
								row.removeClass('product-list');
								// add class gird
								row.addClass('product-grid');

						}
				}
		});


		$(".quantity-adder .add-action").click( function(){
				if( $(this).hasClass('add-up') ) {  
						$("[name=quantity]",'.quantity-adder').val( parseInt($("[name=quantity]",'.quantity-adder').val()) + 1 );
				}else {
						if( parseInt($("[name=quantity]",'.quantity-adder').val())  > 1 ) {
								$("input",'.quantity-adder').val( parseInt($("[name=quantity]",'.quantity-adder').val()) - 1 );
						}
				}
		} );
});