﻿
var selPageSizeDropDown = "";
var selOrderByDropDown = "";

$(document).ready(function () {

    selPageSizeDropDown = "#pagesizedropdown" + $('modkey').val();
    selOrderByDropDown = "#sortorderdropdown" + $('modkey').val();

    $(document).on("nbxgetcompleted", AjaxView_GetList_nbxgetCompleted); // assign a completed event for the ajax calls

    loadProductList();
    loadItemListPopup();

   
	$('.nav-tabs > li > a').click(function(event){
		event.preventDefault();//stop browser to take action for clicked anchor

		//get displaying tab content jQuery selector
		var active_tab_selector = $('.nav-tabs > li.tab-active > a').attr('href');

		//find actived navigation and remove 'active' css
		var actived_nav = $('.nav-tabs > li.tab-active');
		actived_nav.removeClass('tab-active');

		//add 'active' css into clicked navigation
		$(this).parents('li').addClass('tab-active');

		//hide displaying tab content
		$(active_tab_selector).removeClass('tab-active');
		$(active_tab_selector).addClass('tab-hide');

		//show target tab content
		var target_tab_selector = $(this).attr('href');
		$(target_tab_selector).removeClass('tab-hide');
		$(target_tab_selector).addClass('tab-active');
	});

   
    // *****************************************************************************
    // *******  Events for product detail (not ajax)
    // *****************************************************************************
    $(".quantity").keydown(function (e) {
        if (e.keyCode == 8 || e.keyCode <= 46) return; // Allow: backspace, delete.
        if ((e.keyCode >= 35 && e.keyCode <= 39)) return; // Allow: home, end, left, right
        // Ensure that it is a number and stop the keypress
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) e.preventDefault();
    });

    $('.qtyminus').click(function () {
        if (parseInt($('.quantity').val()) > 1)
            $('.quantity').val(parseInt($('.quantity').val()) - 1);
        else
            $('.quantity').val('1');
    });

    $('.qtyplus').click(function () {
        $('.quantity').val(parseInt($('.quantity').val()) + 1);
        if ($('.quantity').val() == 'NaN') $('.quantity').val('1');
    });

});


// *****************************************************************************
// *******  Ajax Completed actions
// *****************************************************************************


function AjaxView_GetList_nbxgetCompleted(e) {

    addHandlers();

    $('.ajaxcatmenu').unbind("click");
    $('.ajaxcatmenu').click(function(event) {
        event.preventDefault();

        $(".active").removeClass("active");
        $(this).parent().addClass("active");

        var pagenumber = $(this).attr("pagenumber");
        if (typeof pagenumber == 'undefined') {
            pagenumber = "1";
        }
        $("#page").val(pagenumber);

        var catid = $(this).attr("catid");
        if (typeof catid != 'undefined') {
            $('#catid').val(catid);
            $('#filter_catid').val(catid);
        }
        $('#catref').val('');
        $('#filter_catref').val('');
        $('#searchtext').val('');

        // add to browser bar and history
        var stateObj = { catid: $(this).attr("catid") };
        history.pushState(stateObj, "Title", $(this).attr("href"));

        loadProductList();
    });

    $('.processing').hide();
    if (e.cmd == 'product_ajaxview_getlist') {

        $('.sortorderselect').unbind("change");
        $('.sortorderselect').change(function () {
            $('#orderby').val($(this).val());
            loadProductList();
        });        

        loadFilters();
    }

    if (e.cmd == 'product_ajaxview_getfilters') {
        // propertyFilterClicked method is in AjaxDisplayProductList_head
        $(".nbs-ajaxfilter input[type='checkbox']").change(propertyFilterClicked);

        if (typeof $.cookie('shopredirectflag') != 'undefined') {
            var shopredirectflag = $.cookie("shopredirectflag");
            if (shopredirectflag != 0) {
                $.cookie("shopredirectflag", 0);
                $('#shopitemid').val(shopredirectflag);
                $(".shoppinglistadd[itemid='" + $('#shopitemid').val() + "']").click();
            }
        }
        $("html, body").animate({ scrollTop: 0 }, 200);
    }

    // Add to Basket for Ajax + Form validation  (Mini-Cart head duplicate)
    var form = $("#Form");
    form.validate();

    $('.addtobasket').unbind("click");
    $('.addtobasket').click(function () {
        if (form.valid()) {
            if (parseInt($('.quantity').val()) < 1) $('.quantity').val('1');
            nbxget('addtobasket', '.entryid' + $(this).attr('itemid'), '#minicartdatareturn'); // Reload Cart
            $('.addedtobasket').delay(10).fadeIn('fast');
        }
    });

    if (e.cmd == 'itemlist_add') {
        $('#shoppinglistadd-' + $('#shopitemid').val()).hide();
        $('#shoppinglistremove-' + $('#shopitemid').val()).show();
        $('#shopitemid').val('');
    }

    if (e.cmd == 'itemlist_remove') {
        $('#shoppinglistadd-' + $('#shopitemid').val()).show();
        $('#shoppinglistremove-' + $('#shopitemid').val()).hide();
        $('#shopitemid').val('');
    }

    // Shopping List Popup
    $('.shoppinglistadd').unbind("click");
    $('.shoppinglistadd').click(function () {
        $('#shopitemid').val($(this).attr('itemid'));
        $(".shoppinglistadd").colorbox({
            inline: true, width: "20%", fixed: true,
            onClosed: function () {
                $('#shopitemid').val('');
            }
        });
    });

    // Wish List events

    $('.wishlistadd').unbind("click");
    $('.wishlistadd').click(function () {
        $('#shoplistname').val($('.shoplistselect').val());
        nbxget('itemlist_add', '#nbs_productajaxview'); //apply serverside
        $('#shoppinglistpopup').colorbox.close();
    });

    $('.shoppinglistremove').unbind("click");
    $('.shoppinglistremove').click(function () {
        $('#shopitemid').val($(this).attr('itemid'));
        nbxget('itemlist_remove', '.entryid' + $(this).attr('itemid')); //apply serverside
    });

    $('.wishlistremoveall').unbind("click");
    $('.wishlistremoveall').click(function () {
        nbxget('itemlist_delete', '.entryid' + $(this).attr('itemid')); //apply serverside
    });

    $('.shoplistselect').unbind("change");
    $('.shoplistselect').change(function () {
        if ($(this).val() == '-1') {
            $('.newlistdiv').show();
            $('.wishlistadd').hide();
            $('.shoplistselect').hide();                
        } else {
            $('#shoplistname').val($(this).val());                
            $('.newlistdiv').hide();
            $('.wishlistadd').show();                
            $('.shoplistselect').show();
        }
    });

    $('.cancelnewlist').unbind("click");
    $('.cancelnewlist').click(function () {
        $('.newlistdiv').hide();
        $('.wishlistadd').show();                
        $('.shoplistselect').show();
        $('.shoplistselect>option:eq(0)').attr('selected', true);
    });

    $('.addnewlist').unbind("click");
    $('.addnewlist').click(function () {
        var newlisttext = $('.newlisttext').val();
        //$('.shoplistselect').append('<option value="' + newlisttext + '" selected="selected">' + newlisttext + '</option>');
        $('.shoplistselect').append( new Option(newlisttext,newlisttext,false,true) );
        $('.newlistdiv').hide();
        $('.wishlistadd').show();                
        $('.shoplistselect').show();
    });

    $('.redirecttologin').unbind("click");
    $('.redirecttologin').click(function () {
        $.cookie("shopredirectflag", $('#shopitemid').val());
        window.location.replace('/default.aspx?tabid=' + $('#logintab').val() + '&returnurl=' + location.protocol + '//' + location.host + location.pathname);
    });
    $('.cancellogin').unbind("click");
    $('.cancellogin').click(function () {
        $.cookie("shopredirectflag", 0);
        $('#shoppinglistpopup').colorbox.close();
    });

}



// *****************************************************************************
// *******  Browser Functions
// *****************************************************************************


// call ajax based on browser history
window.onpopstate = function(e) {
    var currentState = history.state;
    if (currentState) {
        $('#catid').val(currentState.catid);
        $('#filter_catid').val(currentState.catid);
        loadProductList();
    }
};



// *****************************************************************************
// *******  Functions
// *****************************************************************************


function addHandlers() {
    $(selPageSizeDropDown).change(pageSizeChanged);
    $(selOrderByDropDown).change(sortOrderChanged);
}

function pageSizeChanged() {
    $("#pagesize").val($(selPageSizeDropDown).val());
    loadProductList();
}
function sortOrderChanged() {
    $("#orderby").val($(selOrderByDropDown).val());
    loadProductList();
}

function propertyFilterClicked() {
    var list = "";
    $(".nbs-ajaxfilter input[type='checkbox']:checked").each(function () {
        list += $(this).val() + ",";
    });
    $("#propertyfilter").val(list);
    loadProductListFilter();
}
function loadProductList() {
    $('.processing').show();
    nbxget('product_ajaxview_getlist', '#nbs_productajaxview', '#nbs_ajaxproducts');
}
function loadProductListFilter() {
    $('.processing').show();
    nbxget('product_ajaxview_getlistfilter', '#nbs_productajaxview', '#nbs_ajaxproducts');
}
function loadItemListPopup() {
    $('.processing').show();
    nbxget('itemlist_getpopup', '#nbs_productajaxview', '#shoppinglistpopup');
}
function loadFilters() {
    $('.processing').show();
    $("#propertyfiltertypeinside").val($("#filter_propertyfiltertypeinside").val());
    $("#propertyfiltertypeoutside").val($("#filter_propertyfiltertypeoutside").val());
    nbxget('product_ajaxview_getfilters', '#nbs_ajaxfiltermodulesettings', '#nbs_ajaxfilter');
}

function IsInFavorites(productid) {
    var productitemlist = $.cookie("NBSShoppingList");
    if (productitemlist !== null && productitemlist !== undefined) {
        if (productitemlist.indexOf(productid + '*') !== -1) {
            return true;
        }
    }
    return false;
}

function showImage(imgPath, imgAlt) {
  var imgMain = document.getElementById('mainimage');
  imgMain.src = imgPath;
  imgMain.alt = imgAlt;
}
