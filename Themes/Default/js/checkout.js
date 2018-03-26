﻿
        jQuery.fn.extend({
            renameAttr: function (name, newName, removeData) {
                var val;
                return this.each(function () {
                    val = jQuery.attr(this, name);
                    jQuery.attr(this, newName, val);
                    jQuery.removeAttr(this, name);
                    // remove original data
                    if (removeData !== false) {
                        jQuery.removeData(this, name.replace('data-', ''));
                    }
                });
            }
        });

        $(document).ready(function() {

            $('#cmdDeleteCart').unbind();
            $('#cmdDeleteCart').click(function () {
                var msg = $('#cmdClearCart').val();
                if (confirm(msg)) {
                    $('.processing').show();
                    nbxget('cart_clearcart', '#productajaxview');
                }
            });

            $('#cmdRecalcCart').unbind();
            $('#cmdRecalcCart').click(function () {
                $('.processing').show();
                $('#cmdNext').show();
                nbxget('cart_recalculatecart', '.cartdatarow', '', '.quantitycolumn');
            });

            $('#cmdNext').unbind();
            $('#cmdNext').click(function () {
                var cartstep = $('#cartstep').val();
                cartstep = parseInt(cartstep) + 1;
                $('#cartstep').val(cartstep);
                processCartStep('next');
            });
            $('#cmdPrev').unbind();
            $('#cmdPrev').click(function () {
                var cartstep = $('#cartstep').val();
                cartstep = parseInt(cartstep) - 1;
                $('#cartstep').val(cartstep);
                processCartStep('prev');
            });

            $(document).on("nbxgetcompleted", CheckOut_nbxgetCompleted); // assign a completed event for the ajax calls

            // function to do actions after an ajax call has been made.
            function CheckOut_nbxgetCompleted(e) {

                $('.processing').hide();

                // ----------------------------------------------------------------------------
                // --------- render cart list  
                // ----------------------------------------------------------------------------

                if (e.cmd == 'cart_rendercartlist') {

                    $('.removeitem').unbind();
                    $('.removeitem').click(function () {
                        $('.processing').show();
                        $('#itemcode').val($(this).attr('itemcode'));
                        nbxget('cart_removefromcart', '#productajaxview');
                    });

                    $('#cartactions').show();

                    // if we have a cartempty element hide the action buttons
                    if ($('#cartempty').text() != '') {
                        $('#cartactions').hide();
                    } else {
                        $('#cartactions').show();
                    }

                    $(".quantity").keydown(function (e) {
                        if (e.keyCode == 8 || e.keyCode <= 46) return; // Allow: backspace, delete.
                        if ((e.keyCode >= 35 && e.keyCode <= 39)) return; // Allow: home, end, left, right
                        // Ensure that it is a number and stop the keypress
                        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) e.preventDefault();
                    });

                    $('.qtyminus').unbind();
                    $('.qtyminus').click(function () {
                        var oldqty = $('.itemcode' + $(this).attr('itemcode')).val();
                        var newQty = parseInt(oldqty, 10);
                        if (isNaN(newQty)) {
                            newQty = 2;
                        }
                        if (newQty >= 1) {
                            --newQty;
                            $('.itemcode' + $(this).attr('itemcode')).val(newQty);
                        }
                    });
                    $('.qtyplus').unbind();
                    $('.qtyplus').click(function () {
                        var oldqty = $('.itemcode' + $(this).attr('itemcode')).val();
                        var newQty = parseInt(oldqty, 10);
                        if (isNaN(newQty)) {
                            newQty = 0;
                        }
                        ++newQty;
                        $('.itemcode' + $(this).attr('itemcode')).val(newQty);
                    });
                }

                if (e.cmd == 'cart_recalculatecart') {
                    nbxget('cart_rendercartlist', '#productajaxview', '#checkoutdisplay');
                }

                if (e.cmd == 'cart_clearcart' || e.cmd == 'cart_removefromcart') {
                    $('.processing').show();
                    nbxget('cart_rendercartlist', '#productajaxview', '#checkoutdisplay');
                }

                // ----------------------------------------------------------------------------
                // --------- render Address  
                // ----------------------------------------------------------------------------

                if (e.cmd == 'cart_rendercartaddress') {

                    $('#cartactions').show();

                    $('#selectaddress').unbind();
                    $('#selectaddress').change(function() {
                        populateAddressForm($(this).attr('formselector'), $(this).find('option:selected').attr('datavalues'), $(this).find('option:selected').attr('datafields'));
                        $('#ad_billregion').val($('#billaddress_region').val());
                        $('#billaddress_country').trigger("change");
                    });

                    $('#billaddress_country').unbind();
                    $('#billaddress_country').change(function() {
                        $('.checkoutbillformregiondiv').hide();
                        $('.processing').show();
                        nbxget('renderpostdata', '.checkoutbillformcountrydiv', '.checkoutbillformregiondiv');
                    });

                    $('.checkoutbillformregiondiv').unbind();
                    $('.checkoutbillformregiondiv').change(function() {
                        if ($('#ad_billregion').val() != '') {
                            $('#billaddress_region').val($('#ad_billregion').val());
                            $('#ad_billregion').val('');
                        }
                        $('.checkoutbillformregiondiv').show();
                    });

                    $('#selectshipaddress').unbind();
                    $('#selectshipaddress').change(function() {
                        populateAddressForm($(this).attr('formselector'), $(this).find('option:selected').attr('datavalues'), $(this).find('option:selected').attr('datafields'));
                        $('#ads_shipregion').val($('#shipaddress_region').val());
                        $('#shipaddress_country').trigger("change");
                    });

                    $('#shipaddress_country').unbind();
                    $('#shipaddress_country').change(function() {
                        $('.checkoutshipformregiondiv').hide();
                        $('.processing').show();
                        nbxget('renderpostdata', '.checkoutshipformcountrydiv', '.checkoutshipformregiondiv');
                    });

                    $('.checkoutshipformregiondiv').unbind();
                    $('.checkoutshipformregiondiv').change(function() {
                        if ($('#ads_shipregion').val() != '') {
                            $('#shipaddress_region').val($('#ads_shipregion').val());
                            $('#ads_shipregion').val('');
                        }
                        $('.checkoutshipformregiondiv').show();
                    });

                    $('.rblshippingoptions').unbind();
                    $('.rblshippingoptions').change(function() {
                        var selected = $('input[name=extrainfo_rblshippingoptionsradio]:checked');
                        if (selected.val() == '2') {
                            $('.checkoutshipform').show();
                        } else {
                            $('.checkoutshipform').hide();
                        }
                        // disable validation on hidden controls
                        $('input:visible').renameAttr('ignorerequired', 'required');;
                        $('input:hidden').renameAttr('required', 'ignorerequired');
                    });

                    if ($('input[name=extrainfo_rblshippingoptionsradio]:checked').val() == '2') {
                        $('.checkoutshipform').show();
                    } else {
                        $('.checkoutshipform').hide();
                    }

                }

                if (e.cmd == 'cart_updatebilladdress') {
                    $('.processing').show();
                    nbxget('cart_updateshipaddress', '.checkoutshipform');
                }

                if (e.cmd == 'cart_updateshipaddress') {
                    $('.processing').show();
                    nbxget('cart_updateshipoption', '#shippingoptions');
                }

                if (e.cmd == 'cart_updateshipoption') {
                    $('#carttemplate').val('CheckoutSummary.cshtml');
                    $('.processing').show();
                    nbxget('cart_rendersummary', '#productajaxview', '#checkoutdisplay');
                }


                // ----------------------------------------------------------------------------
                // --------- render Summary  
                // ----------------------------------------------------------------------------

                if (e.cmd == 'cart_recalculatesummary') {
                    $('.processing').show();
                    nbxget('cart_rendersummary', '#productajaxview', '#checkoutdisplay');
                }

                if (e.cmd == 'cart_rendersummary') {
                    $('#cartactions').show();

                    $('#cmdRecalcSummary').unbind();
                    $('#cmdRecalcSummary').click(function() {
                        $('.processing').show();
                        $('#carttemplate').val('CheckoutSummary.cshtml');
                        nbxget('cart_recalculatesummary', '#checkoutsummary');
                    });

                    $('#cmdRedirectPay').unbind();
                    $('#cmdRedirectPay').click(function () {
                        $('.processing').show();
                        nbxget('cart_recalculatesummary2', '#checkoutsummary');
                    });

                    $('.shippingmethodselect').unbind();
                    $('.shippingmethodselect').click(function () {
                        $('.processing').show();
                        $('#carttemplate').val('CheckoutSummary.cshtml');
                        nbxget('cart_recalculatesummary', '#checkoutsummary');
                    });

                    //reload shipping provider template on trigger from provider
                    $('.reloadshipprovider').unbind();
                    $('.reloadshipprovider').click(function () {
                        $('.processing').show();
                        nbxget('cart_shippingprovidertemplate', '#checkoutsummary', '#shipprovidertemplates');
                    });
                    //recalc on trigger from provider
                    $('.recalcshipprovider').unbind();
                    $('.recalcshipprovider').click(function () {
                        $('.processing').show();
                        $('#carttemplate').val('CheckoutSummary.cshtml');
                        nbxget('cart_recalculatesummary', '#checkoutsummary');
                    });
                }

                if (e.cmd == 'cart_recalculatesummary2') {
                    $('.processing').show();
                    window.location.href = $('#checkoutpayredirectreturn').text();
                }

                if (e.cmd == 'cart_recalculatesummary') {
                    $('.processing').show();
                    nbxget('cart_shippingprovidertemplate', '#checkoutsummary', '#shipprovidertemplates');
                }

            }

});

function populateAddressForm(selectordiv, datavalues, datafields) {
    // Take the address dropdown data and popluate the address for with it.
    // selectordiv = the selector for the form section that needs popluating
    // datafields = the list of field ids that need popluating (in seq order matching the "data" param)
    // datavalues = the list of data values to be populated.
    if (datavalues != null && datavalues != '') {
        var datarray = datavalues.split(',');
        var fieldarray = datafields.split(',');
        var arrayLength = fieldarray.length;
        for (var i = 0; i < arrayLength; i++) {
            $(selectordiv).find("[id*='" + fieldarray[i] + "']").val(datarray[i]);
        }
    }
}



function processCartStep(buttontype) {

    // show cart list
    if ($('#cartstep').val() == '1') {
        $('.processing').show();
        $('#carttemplate').val('CheckoutList.cshtml');
        $('#cmdDeleteCart').show();
        $('#cmdRecalcCart').show();
        $('#cmdPrev').hide();
        $('#cmdNext').show();
        nbxget('cart_rendercartlist', '#productajaxview', '#checkoutdisplay');
    }

    if ($('#cartstep').val() == '2' || buttontype == 'start') {
        $('#cartstep').val("2");
        $('.processing').show();
        $('#carttemplate').val('CheckoutAddress.cshtml');
        $('#cmdDeleteCart').hide();
        $('#cmdRecalcCart').hide();
        $('#cmdPrev').show();
        $('#cmdNext').show();
        nbxget('cart_rendercartaddress', '#productajaxview', '#checkoutdisplay');
    }

    if ($('#cartstep').val() == '3') {
        var validator = $("#Form").validate();
        if (validator.form()) {
            $('.processing').show();
            $('#carttemplate').val('CheckoutSummary.cshtml');
            $('#cmdDeleteCart').hide();
            $('#cmdRecalcCart').hide();
            $('#cmdPrev').show();
            $('#cmdNext').hide();
            nbxget('cart_updatebilladdress', '.checkoutbillform');
        } else {
            $('#cartstep').val("2");
        }
    }


}


