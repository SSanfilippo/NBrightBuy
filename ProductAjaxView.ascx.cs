// --- Copyright (c) notice NevoWeb ---
//  Copyright (c) 2014 SARL NevoWeb.  www.nevoweb.com. The MIT License (MIT).
// Author: D.C.Lee
// ------------------------------------------------------------------------
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
// TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
// THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
// CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.
// ------------------------------------------------------------------------
// This copyright notice may NOT be removed, obscured or modified without written consent from the author.
// --- End copyright notice --- 

using System;
using System.IO;
using System.Web.UI;
using System.Web.UI.WebControls;
using DotNetNuke.Common;
using NBrightCore.common;
using NBrightDNN;
using NBrightDNN.render;
using Nevoweb.DNN.NBrightBuy.Base;
using Nevoweb.DNN.NBrightBuy.Components;
using Nevoweb.DNN.NBrightBuy.Components.Products;

namespace Nevoweb.DNN.NBrightBuy
{

    /// -----------------------------------------------------------------------------
    /// <summary>
    /// The ViewNBrightGen class displays the content
    /// </summary>
    /// -----------------------------------------------------------------------------
    public partial class ProductAjaxView : NBrightBuyFrontOfficeBase
    {

        private String _eid = "";
        private String _ename = "";
        private String _catid = "";
        private String _modkey = "";
        private String _templD = "";
        private Boolean _displayentrypage = false;
        private NavigationData _navigationdata;
        public String EntityTypeCode = "PRD";
        public String EntityTypeCodeLang = "PRDLANG";
        private String _itemListName = "";
        private String _print = "";
        private String _printtemplate = "";
        private String _guidkey = "";
        private Boolean _404code = false;
        private string _controlPath = "";

        #region Event Handlers

        protected override void Render(HtmlTextWriter writer)
        {
            base.Render(writer);
            if (_404code)
            {
               // Commented out becuase this can give a page not found error page on IIS, depending on settings.
               // Response.StatusCode = 404;
            }
        }

        override protected void OnInit(EventArgs e)
        {
            _eid = Utils.RequestQueryStringParam(Context, "eid");
            _print = Utils.RequestParam(Context, "print");
            _printtemplate = Utils.RequestParam(Context, "template");
            _controlPath = ControlPath;

            //SK this tells basepage not to inject the pager
            EnablePaging = false;
            
            base.OnInit(e);

            // check if we're using a typcode for the data.
            if (ModSettings != null)
            {
                // check if we're using a typcode for the data.
                var modentitytypecode = ModSettings.Get("entitytypecode");
                if (modentitytypecode != "")
                {
                    EntityTypeCode = modentitytypecode;
                    EntityTypeCodeLang = modentitytypecode + "LANG";
                }
                // check if we're using a provider _controlPath for the templates.
                var provider_controlPath = ModSettings.Get("provider_controlPath");
                if (provider_controlPath != "")
                {
                    _controlPath = "/DesktopModules/NBright/" + provider_controlPath + "/";
                }
            }

            // if guidkey entered instead of eid, find it using the guid and assign to _eid
            _guidkey = Utils.RequestQueryStringParam(Context, "guidkey");
            if (_guidkey == "") _guidkey = Utils.RequestQueryStringParam(Context, "ref");
            if (_eid== "" && _guidkey != "")
            {
                var guidData = ModCtrl.GetByGuidKey(PortalId, -1, EntityTypeCode, _guidkey);
                if (guidData != null)
                    _eid = guidData.ItemID.ToString("D");
                else
                    _eid = "0";
            }

            // if we want to print we need to open the browser with a startup script, this points to a Printview.aspx. (Must go after the ModSettings has been init.)
            if (_print != "") Page.ClientScript.RegisterStartupScript(this.GetType(), "printproduct", "window.open('" + StoreSettings.NBrightBuyPath() + "/PrintView.aspx?itemid=" + _eid + "&printcode=" + _print + "&template=" + _printtemplate + "&theme=" + ModSettings.Get("themefolder") + "','_blank');", true);

            if (ModuleKey == "")  // if we don't have module setting jump out
            {
                var lit = new Literal();
                lit.Text = "NO MODULE SETTINGS";
                phData.Controls.Add(lit);
                return;
            }

            _navigationdata = new NavigationData(PortalId, ModuleKey);

            // Pass in a template specifying the token to create a friendly url for paging. 
            // (NOTE: we need this in NBS becuase the edit product from list return url will copy the page number and hence paging will not work after editing if we don;t do this)
            //CtrlPaging.HrefLinkTemplate = "[<tag type='valueof' databind='PreText' />][<tag type='if' databind='Text' testvalue='' display='{OFF}' />][<tag type='hrefpagelink' moduleid='" + ModuleId.ToString("") + "' />][<tag type='endif' />][<tag type='valueof' databind='PostText' />]";
            //CtrlPaging.UseListDisplay = true;
            try
            {
                _catid = Utils.RequestQueryStringParam(Context, "catid");

                #region "set templates based on entry id (eid) from url"

                _ename = Utils.RequestQueryStringParam(Context, "entry");
                _modkey = Utils.RequestQueryStringParam(Context, "modkey");

                // see if we need to display the entry page.
                if ((_modkey == ModuleKey | _modkey == "") && (_eid != "" | _ename != "")) _displayentrypage = true;

                // if we have entry detail display, but no catd, get the default one.
                if (_displayentrypage && _catid == "" && Utils.IsNumeric(_eid))
                {
                    var prdData = ProductUtils.GetProductData(Convert.ToInt32(_eid),Utils.GetCurrentCulture(), true, EntityTypeCode);
                    var defcat = prdData.GetDefaultCategory();
                    if (defcat != null) _catid = defcat.categoryid.ToString("");
                }

                if (ModSettings.Get("listonly").ToLower() == "true") _displayentrypage = false;

                // get template codes
                if (_displayentrypage)
                {
                    _templD = ModSettings.Get("razordetailtemplate");
                    if (_templD == "") _templD = ModSettings.Get("txtdisplayentrybody"); // legacy name
                }
                else
                {
                    _templD = ModSettings.Get("razorlisttemplate");
                    if (_templD == "") _templD = ModSettings.Get("txtdisplaybody"); // legacy name
                }

                #endregion

            }
            catch (Exception exc)
            {
                // remove any cookie which might store SQL in error.
                _navigationdata.Delete();
                DisplayProductError(exc.ToString());
            }

        }

        protected override void OnLoad(EventArgs e)
        {
            try
            {
                base.OnLoad(e);
                if (Page.IsPostBack == false)
                {
                    // do razor code
                    RazorPageLoad();
                }
            }
            catch (Exception exc) //Module failed to load
            {
                //display the error on the template (don;t want to log it here, prefer to deal with errors directly.)
                var l = new Literal();
                l.Text = exc.ToString();
                phData.Controls.Add(l);
                // remove any nav data which might store SQL in error.
                _navigationdata.Delete();
            }
        }

        private void RazorPageLoad()
        {
            NBrightInfo objCat = null;

            if (_templD.Trim() != "")  // if we don;t have a template, don't do anything
            {

                if (_displayentrypage)
                {
                    // get correct itemid, based on eid given
                    _eid = GetEntryIdFromName(_eid);
                    RazorDisplayDataEntry(_eid);
                }
                else
                {
                    ModSettings.Set("navigationfilename", _navigationdata.GetTempFileName());                        
                    // insert page header text
                    NBrightBuyUtils.RazorIncludePageHeaderNoCache(ModuleId, Page, Path.GetFileNameWithoutExtension(_templD) + "_head" + Path.GetExtension(_templD), _controlPath, ModSettings.ThemeFolder, ModSettings.Settings());
                }
            }

        }

        #endregion


        #region "Methods"

        private String GetEntryIdFromName(String entryId)
        {
            // get correct itemid, based on eid given
            if (_ename != "")
            {
                var o = ModCtrl.GetByGuidKey(PortalId, ModuleId, EntityTypeCodeLang, _ename);
                if (o == null)
                {
                    o = ModCtrl.GetByGuidKey(PortalId, ModuleId, EntityTypeCode, _ename);
                    if (o != null)
                    {
                        entryId = o.ItemID.ToString("");
                    }
                }
                else
                {
                    entryId = o.ParentItemId.ToString("");
                }
            }
            return entryId;
        }

        private void RazorDisplayDataEntry(String entryId)
        {
            var productData = new ProductData();
            if (Utils.IsNumeric(entryId))
            {
                productData = ProductUtils.GetProductData(Convert.ToInt32(entryId), Utils.GetCurrentCulture(), true, EntityTypeCode);
            }

            if (productData.Exists)
            {

                if (PortalSettings.HomeTabId == TabId)
                    PageIncludes.IncludeCanonicalLink(Page, Globals.AddHTTP(PortalSettings.PortalAlias.HTTPAlias)); //home page always default of site.
                else
                    PageIncludes.IncludeCanonicalLink(Page, NBrightBuyUtils.GetEntryUrl(PortalId, _eid, "", productData.SEOName, TabId.ToString("")));

                // overwrite SEO data
                if (productData.SEOName != "")
                    BasePage.Title = productData.SEOTitle;
                else
                    BasePage.Title = productData.ProductName;

                if (productData.SEODescription != "") BasePage.Description = productData.SEODescription;
                if (productData.SEOTagwords != "") BasePage.KeyWords = productData.SEOTagwords;

                // if debug , output the xml used.
                if (DebugMode) productData.Info.XMLDoc.Save(PortalSettings.HomeDirectoryMapPath + "debug_entry.xml");
                // insert page header text
                NBrightBuyUtils.RazorIncludePageHeader(ModuleId, Page, Path.GetFileNameWithoutExtension(_templD) + "_head" + Path.GetExtension(_templD), _controlPath, ModSettings.ThemeFolder, ModSettings.Settings(), productData);

                #region "do razor template"

                var strOut = NBrightBuyUtils.RazorTemplRender(_templD, ModuleId, "productdetailrazor" + ModuleId.ToString() + "*" + entryId, productData, _controlPath, ModSettings.ThemeFolder, Utils.GetCurrentCulture(), ModSettings.Settings());
                var lit = new Literal();
                lit.Text = strOut;
                phData.Controls.Add(lit);

                #endregion
            }
            else
            {
                _404code = true;
                var strOut = NBrightBuyUtils.RazorTemplRender("NBS_ProductNotFound.cshtml", ModuleId, "", productData, _controlPath, ModSettings.ThemeFolder, Utils.GetCurrentCulture(), ModSettings.Settings());
                var lit = new Literal();
                lit.Text = strOut;
                phData.Controls.Add(lit);

            }

        }

        private void DisplayProductError(String msg)
        {
            //display the error if superuser (don;t want to log it.)
            var errmsg = ModCtrl.GetTemplateData(ModSettings, "productunavailable.html", Utils.GetCurrentCulture(), DebugMode);
            if (UserInfo.IsSuperUser) errmsg += msg;
            var obj = new NBrightInfo(true);
            var razorTemplateKey = "NBrightBuyRazorKey*productunavailable" + PortalId.ToString() + "*" + Utils.GetCurrentCulture();
            errmsg = RazorUtils.RazorRender(obj, errmsg, razorTemplateKey, StoreSettings.Current.DebugMode);
            var l = new Literal();
            l.Text = errmsg;
            phData.Controls.Add(l);
            //Response.StatusCode = 404; //causes 404 page on live site???
        }

        #endregion



    }

}
