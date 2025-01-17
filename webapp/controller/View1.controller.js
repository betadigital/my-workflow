sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/UIComponent"
], (Controller, UIComponent) => {
  "use strict";

  return Controller.extend("sap.ui.workflowtrial.controller.View1", {
    onInit: function () {    
       const oWorkflowModel = this.getOwnerComponent().getModel("workflowModel");   
       this.getDataFromAPI()
       .then((data)=>{
          const oData = {
            rows: data
          }
          oWorkflowModel.setProperty("/workflowData", oData)
          this.getView().setModel(oWorkflowModel);
       })
       .catch((error)=>{
        console.error(error.message)
       })
  },

  onRowSelect: function (oEvent) {
    const oSelectedItem = oEvent.getParameter("listItem");
    const oContext = oSelectedItem.getBindingContext('workflowModel');
    const instanceId = oContext.getProperty("id");
    UIComponent.getRouterFor(this).navTo("details", { rowId: instanceId });
  },

  getDataFromAPI: async function (){
      const data = await this._fetchApiData()
      // const uaaToken = await this._fetchUAABearerToken()
      // const user = await this._fetchUserData(uaaToken)
      // console.log(user)
      return data;
  },

  _fetchUAABearerToken: async function(){
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    myHeaders.append("Cookie", "__VCAP_ID__=76109d11-6c8e-4a92-6487-e31d; JSESSIONID=F3E49EDF9463822CA9D07E20B161B0A1; X-Uaa-Csrf=Q2f062qeQwRwAz2DRiRb5v; __VCAP_ID__=42dff77c-a804-4072-7d3f-3e9f");
    const urlencoded = new URLSearchParams();
    urlencoded.append("grant_type", "client_credentials");
    urlencoded.append("client_id", "sb-sapuiworkflowtrial!t54335");
    urlencoded.append("client_secret", "edc9a7fe-bbe8-4ff0-a81a-42e99617c874$yyLufIO0MZbUQcaAtjqW42PPSDfFo7nnBGYv17rgDUI=");

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: urlencoded,
      redirect: "follow"
    };

    try {
      const response = await fetch("/token_api", requestOptions)
      if(!response.ok){
          throw new Error(`Error in fetching token with status: ${response.status}`)
      }
      const data = await response.json()
      return data.access_token;
    } catch(error){
        console.error(error.message)
    } 
  },

  _fetchApiData: async function () {
    const requestOptions = {
      method: "GET",
      redirect: "follow"
    };
    const user = 'shaun.bradridge@betadigital.com.au'
    try {
      const response = await fetch(`/workflow_api/v1/workflow-instances?startedBy=${user}`, requestOptions)
      if(!response.ok){
          throw new Error(`Error in fetching workflow instances with status: ${response.status}`)
      }
      const data = await response.json()
      return data;
    } catch(error){
        console.error(error.message)
    } 
  },

  _fetchUserData: async function(token){
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + token);
    myHeaders.append("Accept", "application/json")
    
    const requestOptions = {
      method: "GET",
      headers: myHeaders
    };

    try {
      const response = await fetch("/user_api/userinfo", requestOptions)
      if(!response.ok){
          throw new Error(`Error in user data with status: ${response.status}`)
      }
      const user = await response.json();
      return user;
    } catch(error){
        console.error(error.message)
    } 
  }
  
  });
});