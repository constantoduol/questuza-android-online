
function AppData() {
    $(document).ready(function () {
        var path = window.location.pathname;
        path = path.replace("/android_asset", "");
        app.appData.formData.onload.once();
        app.appData.formData.onload.always();
        app.skippable_pages = [app.pages.paginate, app.pages.account, "/help/"];
        app.ignoreIrrelevantPaths(path);
        if (app.appData.formData.onload[path]) {
            app.appData.formData.onload[path]();
        }
    });
}

AppData.prototype.onload = {
    once: function () {
        //run once when the app loads
        //always enable modal windows
        var modalArea = $("<div id='modal_area'></div>");
        if (!$("#modal_area")[0])
            $("body").append(modalArea);

        //setup the pages
        var bType = app.appData.formData.login.current_user.business_type;
        var prodPage = bType === "goods" ? "/views/product.html" : "/views/service_product.html";
        app.pages.products = prodPage;
        app.pages.users = "/views/user.html";
        app.pages.business = "/views/business.html";
        app.pages.expenses = "/views/expenses.html";
        app.pages.reports = "/views/reports.html";
        app.pages.paginate = "/views/paginate.html";
        app.pages.billing = "/views/billing.html";
        app.pages.pay_bill = "/views/pay_bill.html";
        app.pages.sale = "/sale.html";
        app.pages.sale_touch = "/sale_touch.html";
        app.pages.account = "/views/account.html";
        app.pages.suppliers = "/views/suppliers.html";
        app.pages.supplier_select = "/views/supplier_select.html";
        app.pages.supplier_account = "/views/supplier_account.html";
        app.pages.settings = "/views/settings.html";
        app.pages.keypad = "/views/keypad.html";

        //setup the dominant privilege
        app.dominant_privilege = app.appData.formData.login.current_user.dominantPrivilege();
    },
    always: function () {
        //run always when a page is loaded
        app.appData.formData.onload.setupAccount();

    },
    setupAccount: function () {
        //always shorten the username
        var user = app.appData.formData.login.current_user.name;
        var shortUser;
        if (user && user.length > 20) {
            shortUser = user.substring(0, 20) + "..."; //no overlong usernames
        }
        else {
            shortUser = user;
        }

        //setup account details
        var logoutLink = $("#logout_link");
        logoutLink.html(shortUser);
        logoutLink.unbind("click");
        logoutLink.click(function () {
            var m = app.ui.modal("", "User Account", {
                cancelText: "Cancel",
                cancel: function () {
                    m.modal('hide');
                }
            });
            app.loadPage({
                load_url: app.pages.account,
                load_area: "modal_content_area",
                onload: function () {
                    $("#sign_out_link").click(app.logout);
                    $("#about_link").click(app.brand);
                    $("#activate_link").click(app.activateProduct);
                    $("#help_link").click(function () {
                        app.paginate({
                            title: "Help",
                            save_state: true,
                            save_state_area: "content_area",
                            onload_handler: app.currentPage(),
                            onload: function () {
                                m.modal('hide');
                                app.loadPage({
                                    load_url: app.sub_context.help_url,
                                    load_area: "paginate_body"
                                });
                            }
                        });
                    });

                    $("#change_password_link").click(function () {
                        window.location = "/change.html?user_name=" + user;
                    });

                }
            });
        });
    },
    "/index.html": function () {
        app.context = app.appData.formData.login;
    },
    "/": function () {
        this["/index.html"]();
    },
    "/views/billing.html": function () {
        var currentMenu = {menu: {"Billing History": app.billingHistory, "Pay Bill": app.payBill,
                "Current Bill Tier" : app.currentBillTier}, params: {display_area: "billing_card", inline: true}};
        app.setCurrentMenu(currentMenu);
        $("#title_area").html("Billing");
    },
    "/views/pay_bill.html": function () {
        $("#verify_trans_btn").click(app.verifyPayBill);
    },
    "/views/paginate.html": function () {
        //dont show a print button on mobile
        if (app.platform === "mobile") {
            $("#paginate_print").remove();
        }
    },
    "/sale.html": function () {
        app.context = app.appData.formData.sale;
        app.sub_context = app.appData.formData.sale.product;
        $("#product_display_area").html("");
        $("#category_area").html("");
        app.fetchBusinessSettings();
        app.getSetting("user_interface") === "desktop" ? app.loadSaleSearch() : app.loadCategories("category_area", "category", "");

        $("#home_link").click(function () {
            $("#category_area").html("");
            $("#product_display_area").html("");
            app.getSetting("user_interface") === "desktop" ? app.loadSaleSearch() : app.loadCategories("category_area", "category", "");
        });

        $("#clear_sale_link").click(function () {
            app.clearSale();
        });

        $("#commit_link").click(app.commitSale);
        $("#todays_sale_link").click(function () {
            app.todaySales(app.appData.formData.login.current_user.name, "all");
        });
        $("#logout_link").unbind("click");
        $("#logout_link").click(app.logout);

        if (app.dominant_privilege === "pos_middle_service") {
            $("#users_report_link").css("visibility", "visible");
            $("#users_report_link").click(function () {
                var select = "<label for='user_select'>Select User</label>\n\
                                    <select id='user_select'><option value='all'>All</select>\n\
                                    <label for='category_select'>Product Category</label>\n\
                                    <select id='category_select'><option value='all'>All</select>";
                var m = app.ui.modal(select, "Generate Report", {
                    okText: "Generate",
                    ok: function () {
                        app.todaySales($("#user_select").val(), $("#category_select").val());
                        m.modal('hide');
                    }
                });

                app.xhr({
                    data: {category_type: "category"},
                    service: "" + app.dominant_privilege + "," + app.dominant_privilege + "",
                    message: "all_users,product_categories",
                    load: false,
                    success: function (data) {
                        var key = app.dominant_privilege + "_all_users";
                        var key1 = app.dominant_privilege + "_product_categories";
                        var userResp = data.response[key].data;
                        var catResp = data.response[key1].data.PRODUCT_CATEGORY;
                        $.each(userResp.USER_NAME, function (index) {
                            var name = userResp.USER_NAME[index];
                            $("#user_select").append($("<option value=" + name + ">" + name + "</option>"));
                        });

                        $.each(catResp, function (index) {
                            var cat = catResp[index];
                            $("#category_select").append($("<option value=" + cat + ">" + cat + "</option>"));
                        });

                        app.runLater(200, function () {
                            $("#modal_area_button_ok").focus();
                        });
                    }
                });
            });
        }
        if (app.platform === "web") {
            if (!$("#receipt_area")[0]) {
                $("body").append("<iframe id='receipt_area' name='receipt_area' style='width:0px;height:0px'></iframe>");
                $("body").append("<div id='receipt_area_dummy' style='display:none'></div>");
                var cssLink = document.createElement("link");
                cssLink.href = "css/bootstrap.min.css";
                cssLink.rel = "stylesheet";
                cssLink.type = "text/css";
                app.runLater(2000, function () {
                    window.frames['receipt_area'].document.getElementsByTagName("head")[0].appendChild(cssLink);
                });
            }
        }
        var currentMenu = {menu: {
                "Sign Out": "app.logout()",
                "Today's Sales": "app.todaySales(app.appData.formData.login.current_user.name, 'all')"},
            params: {
                display_area: "content_area"
            }};
        //app.setCurrentMenu(currentMenu);
        jse.setCurrentMenu(JSON.stringify(currentMenu));
    },
    "/admin.html": function () {
        app.context = app.appData.formData.admin;
        app.loadPage({load_url: app.pages.products, load_area: "content_area"});
        $("#logo_cont_main").click(app.brand);
        var bussName = localStorage.getItem("business_name");
        if (!bussName) {
            var m = app.ui.modal("Welcome, Please proceed to setup your business", "No Business Set", {
                ok: function () {
                    app.loadPage({load_url: app.pages.business, load_area: "content_area"});
                    m.modal('hide');
                },
                cancel: function () {
                    alert("No business set, signing out");
                    app.logout();
                },
                okText: "Proceed",
                cancelText: "Cancel"
            });
        }

        //check billing and settings
        app.xhr({
            data: {},
            service: "open_data_service,open_data_service",
            message: "fetch_account_balance,fetch_settings",
            load: false,
            success: function (resp) {
                var amount = parseFloat(resp.response.open_data_service_fetch_account_balance.data.balance);
                var timestamp = parseInt(resp.response.open_data_service_fetch_account_balance.data.timestamp);
                var diff = $.now() - timestamp;
                if (amount > 0 && diff > 259200000) { //3 days after invoicing
                    //tell the user about this
                    var m = app.ui.modal("Your account is in arrears<br>Please pay your bill<br>" +
                            "Amount Due : Kshs " + app.formatMoney(amount) + "", "Billing", {
                        okText: "Pay Now",
                        cancelText: "Pay Later",
                        ok: function () {
                            m.modal('hide');
                            app.loadPage({
                                load_url: app.pages.billing,
                                load_area: 'content_area',
                                onload: function () {
                                    $("#billing_pay_btn").click();
                                }
                            });
                        },
                        cancel: function () {

                        }
                    });
                }

                var r = resp.response.open_data_service_fetch_settings.data;
                localStorage.setItem("settings", JSON.stringify(r));

            }
        });

        var currentMenu = {
                "Products": function () {
                    app.loadPage({load_url: app.pages.products, load_area: 'content_area'});
                },
                "Users": function () {
                    app.loadPage({load_url: app.pages.users, load_area: 'content_area'});
                },
                "Business": function () {
                    app.loadPage({load_url: app.pages.business, load_area: 'content_area'});
                },
                "Billing": function () {
                    app.loadPage({load_url: app.pages.billing, load_area: 'content_area'});
                },
                "Suppliers": function () {
                    app.loadPage({load_url: app.pages.suppliers, load_area: 'content_area'});
                },
                "Incomes and Expenses": function () {
                    app.loadPage({load_url: app.pages.expenses, load_area: 'content_area'});
                },
                "Reports": function () {
                    app.loadPage({load_url: app.pages.reports, load_area: 'content_area'});
                },
                "Sign Out" : function(){
                    app.logout();
                }
        };
        $("#menu_link").click(function () {
            app.showModalMenu(currentMenu);
        });
    },
    "/views/user.html": function () {
        app.sub_context = app.context.user;
        $("#search_link").click(app.allUsers);
        app.setUpAuto(app.context.user.fields.search_users);
        var currentMenu = {menu: {"Create User": app.createUser,
                "Update User": app.updateUser,
                "Delete User": function () {
                    app.generalUserRequest('delete_user');
                },
                "Disable User": function () {
                    app.generalUserRequest('disable_user');
                },
                "Enable User": function () {
                    app.generalUserRequest('enable_user');
                },
                "Reset Password": app.resetPassword},
            params: {display_area: "content_area"}};
        app.setCurrentMenu(currentMenu);
        $("#title_area").html("Users");
    },
    "/views/product.html": function () {
        app.sub_context = app.context.product;
        $("#search_link").click(function () {
            app.allProducts(app.pages.products);
        });
        $("#product_quantity_type").click(function () {
            app.toggleSwitch({id : "product_quantity_type",toggle_values : ["+","-"], colors : ["green","red"]});
        });
        app.setUpAuto(app.context.product.fields.search_products);
        app.setUpAuto(app.context.product.fields.product_category);
        app.setUpAuto(app.context.product.fields.product_sub_category);
        app.setUpAuto(app.context.product.fields.product_parent);
        app.setUpDate("product_expiry_date", true); //has limit
        app.xhr({
            data: {category_type: "category"},
            service: app.dominant_privilege,
            message: "product_categories",
            load: false,
            cache: true,
            success: function (resp) {
                var r = resp.response.data.PRODUCT_CATEGORY;
                if (!r) return;
                 r.unshift("all");
                 $("#product_categories").click(function(){
                     app.launchSelect({id : "product_categories",title : "Product Categories",values : r,html : r}); 
                 });
            }
        });
        var currentMenu = {menu: {"Create Product": app.createProduct,
                "Update Product": app.updateProduct,
                "Delete Product": app.deleteProduct,
                "Suppliers": app.supplierSelect},
            params: {display_area: "content_area"}};
        app.setCurrentMenu(currentMenu);
        $("#title_area").html("Products");
    },
    "/views/service_product.html": function () {
        app.sub_context = app.context.service_product;
        $("#search_link").click(function () {
            app.allProducts(app.pages.products);
        });
        app.setUpAuto(app.context.service_product.fields.search_products);
        app.setUpAuto(app.context.service_product.fields.product_category);
        app.setUpAuto(app.context.service_product.fields.product_sub_category);
        app.setUpAuto(app.context.service_product.fields.product_parent);
        if (app.getSetting("track_stock") === "0") {
            $("#product_quantity").remove();
            $("#product_quantity_label").remove();
        }
        app.xhr({
            data: {category_type: "category"},
            service: app.dominant_privilege,
            message: "product_categories",
            load: false,
            cache: true,
            success: function (resp) {
                var r = resp.response.data.PRODUCT_CATEGORY;
                if (!r)
                    return;
                $("#product_categories").html("");
                $("#product_categories").append($("<option value='all'>All</option>"));
                $.each(r, function (index) {
                    var cat = r[index];
                    $("#product_categories").append($("<option value=" + cat + ">" + cat + "</option>"));
                });
            }
        });
        var currentMenu = {menu: {"Create Product": app.createProduct,
                "Update Product": app.updateProduct,
                "Delete Product": app.deleteProduct,
                "Suppliers": app.supplierSelect},
            params: {display_area: "content_area"}};
        app.setCurrentMenu(currentMenu);
        $("#title_area").html("Products");
    },
    "/views/supplier_select.html": function () {
        app.setUpAuto(app.context.suppliers.fields.search_suppliers);
    },
    "/views/suppliers.html": function () {
        app.sub_context = app.context.suppliers;
        app.setUpAuto(app.context.suppliers.fields.search_suppliers);
        $("#search_link").click(app.allSuppliers);
        $("#country").html("");
        $.each(app.nations, function (index) {
            var nation = app.nations[index];
            $("#country").append($("<option value=" + nation + ">" + nation + "</option>"));
        });

        var currentMenu = {menu: {"Create Supplier": function () {
                    app.supplierAction('create');
                },
                "Update Supplier": function () {
                    app.supplierAction('update');
                },
                "Delete Supplier": function () {
                    app.supplierAction('delete');
                }
            }, params: {display_area: "content_area"}};
        app.setCurrentMenu(currentMenu);
        $("#title_area").html("Suppliers");

    },
    "/views/business.html": function () {
        $("#country").html("");
        $.each(app.nations, function (index) {
            var nation = app.nations[index];
            $("#country").append($("<option value=" + nation + ">" + nation + "</option>"));
        });

        $("#business_category").html("");
        $.each(app.business_categories, function (index) {
            var category = app.business_categories[index];
            $("#business_category").append($("<option value=" + category + ">" + category + "</option>"));
        });
        //load all values for business
        app.xhr({
            data: {},
            service: "open_data_service",
            message: "business_data",
            load: true,
            success: function (data) {
                var resp = data.response.data;
                $("#business_name").val(resp.BUSINESS_NAME[0]);
                $("#country").val(resp.COUNTRY[0]);
                $("#city").val(resp.CITY[0]);
                $("#postal_address").val(resp.POSTAL_ADDRESS[0]);
                $("#phone_number").val(resp.PHONE_NUMBER[0]);
                $("#company_website").val(resp.COMPANY_WEBSITE[0]);
                $("#business_type").val(resp.BUSINESS_TYPE[0]);
                $("#business_category").val(resp.BUSINESS_CATEGORY[0]);
                $("#business_descrip").val(resp.BUSINESS_DESCRIP[0]);

            }
        });

        var currentMenu = {menu: {"Create Business": function () {
                    app.saveBusiness('create');
                },
                "Update Business": function () {
                    app.saveBusiness('update');
                },
                "Delete Business": function () {
                    app.saveBusiness('delete');
                },
                "Settings": function () {
                    app.loadSettings();
                }
            },
            params: {display_area: "content_area"}};
        app.setCurrentMenu(currentMenu);
        $("#title_area").html("Business");


    },
    "/views/expenses.html": function () {
        app.sub_context = app.context.expense;
        $("#save_resource_btn").click(app.addResource);
        app.setUpDate("start_date"); //no limit
        app.setUpDate("end_date"); //no limit
        $("#profit_and_loss_btn").click(app.profitAndLoss);
        app.setUpAuto(app.context.expense.fields.expense_name);
        $("#title_area").html("Incomes and Expenses");
    },
    "/change.html": function () {
        $("#user_name").val(app.getUrlParameter("user_name"));
        $("#old_password").val(app.getUrlParameter("pass_word"));
    },
    "/views/reports.html": function () {
        app.sub_context = app.context.reports;
        $("#search_link").click(function () {
            app.allProducts(app.pages.reports);
        });

        $("#report_type").change(function () {
            var report = $("#report_type").val();
            if (report === "supplier_history") {
                $("#stock_select_suppliers_div").css("display", "block");
            }
            else {
                $("#stock_select_suppliers_div").css("display", "none");
            }
        });

        app.setUpDate("start_date"); //no limit
        app.setUpDate("end_date"); //no limit
        app.setUpAuto(app.context.reports.fields.search_products);
        var bType = app.appData.formData.login.current_user.business_type;
        if (bType === "services") {
            $("#stock_low_btn").remove();
            $("#stock_expiry_btn").remove();
        }

        $.each(app.times, function (index) {
            var time = app.times[index];
            $("#start_time").append($("<option value=" + time + ">" + time + "</option>"));
            $("#stop_time").append($("<option value=" + time + ">" + time + "</option>"));
        });
        //load all users
        app.xhr({
            data: {category_type: "category"},
            service: "" + app.dominant_privilege + "," + app.dominant_privilege + "," + app.dominant_privilege + "",
            message: "all_users,all_suppliers,product_categories",
            load: false,
            success: function (data) {
                var key = app.dominant_privilege + "_all_users";
                var key1 = app.dominant_privilege + "_all_suppliers";
                var key2 = app.dominant_privilege + "_product_categories";
                var userResp = data.response[key].data;
                var supResp = data.response[key1].data;
                var catResp = data.response[key2].data.PRODUCT_CATEGORY;
                $("#stock_select_users").html("<option value='all'>All</option>");
                $.each(userResp.USER_NAME, function (index) {
                    var name = userResp.USER_NAME[index];
                    $("#stock_select_users").append($("<option value=" + name + ">" + name + "</option>"));
                });

                $("#stock_select_suppliers").html("<option value='all'>All</option>");
                $.each(supResp.SUPPLIER_NAME, function (index) {
                    var name = supResp.SUPPLIER_NAME[index];
                    var id = supResp.ID[index];
                    $("#stock_select_suppliers").append($("<option value=" + id + ">" + name + "</option>"));
                });

                $("#product_categories").html("<option value='all'>All</option>");
                $.each(catResp, function (index) {
                    var cat = catResp[index];
                    $("#product_categories").append($("<option value=" + cat + ">" + cat + "</option>"));
                });
            }
        });
        var currentMenu = {menu: {"Generate Report": app.stockHistory,
                "Stock Expiry": function () {
                    app.stockExpiry(app.pages.reports);
                },
                "Stock Low": function () {
                    app.stockLow(app.pages.reports)
                }},
            params: {display_area: "content_area", inline: true}};
        app.setCurrentMenu(currentMenu);
        $("#title_area").html("Reports");
    }
};