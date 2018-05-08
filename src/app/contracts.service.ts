import * as Web3 from 'web3';

import { Loan } from './loan.model';
import { Injectable } from '@angular/core';

declare let require: any;
declare let window: any;

let tokenAbi = require('./contracts/Token.json');
let engineAbi = require('./contracts/NanoLoanEngine.json');
let extensionAbi = require('./contracts/NanoLoanEngineExtension.json');

@Injectable()
export class ContractsService {
    private _account: string = null;
    private _web3: any;
  
    private _rcnContract: any;
    private _rcnContractAddress: string = "0x2f45b6fb2f28a73f110400386da31044b2e953d4";
  
    private _rcnEngine: any;
    private _rcnEngineAddress: string = "0xbee217bfe06c6faaa2d5f2e06ebb84c5fb70d9bf";

    private _rcnExtension: any;
    private _rcnExtensionAddress: string = "0xd4cd87d5155b83eb9f3cec4c02c32df15bcde6b6";

    constructor() {
      if (typeof window.web3 !== 'undefined') {
        // Use Mist/MetaMask's provider
        this._web3 = new Web3(window.web3.currentProvider);
  
        // if (this._web3.version.network !== '3') {
        //   alert('Please connect to the Ropsten network');
        //}
      } else {
        console.warn(
          'Please use a dapp browser like mist or MetaMask plugin for chrome'
        );
      }
  
      this._rcnContract = this._web3.eth.contract(tokenAbi.abi).at(this._rcnContractAddress);
      this._rcnEngine = this._web3.eth.contract(engineAbi.abi).at(this._rcnEngineAddress);
      this._rcnExtension = this._web3.eth.contract(extensionAbi.abi).at(this._rcnExtensionAddress);
    }

    private async getAccount(): Promise<string> {
        if (this._account == null) {
          this._account = await new Promise((resolve, reject) => {
            this._web3.eth.getAccounts((err, accs) => {
              if (err != null) {
                alert('There was an error fetching your accounts.');
                return;
              }
      
              if (accs.length === 0) {
                alert(
                  'Couldn\'t get any accounts! Make sure your Ethereum client is configured correctly.'
                );
                return;
              }
              resolve(accs[0]);
            })
          }) as string;
      
          this._web3.eth.defaultAccount = this._account;
        }
      
        return Promise.resolve(this._account);
    }

    public async getUserBalanceRCN(): Promise<number> {
        let account = await this.getAccount();
      
        return new Promise((resolve, reject) => {
          let _web3 = this._web3;
          this._rcnContract.balanceOf.call(account, function (err, result) {
            if(err != null) {
              reject(err);
            }
      
            resolve(_web3.fromWei(result));
          });
        }) as Promise<number>;
    }

    public async getOpenLoans() : Promise<Loan[]> {      
        return new Promise((resolve, reject) => {
          let _web3 = this._web3;
          this._rcnExtension.searchOpenLoans.call(this._rcnEngineAddress, 0, 0, function (err, result) {
            if(err != null) {
              reject(err);
            }

            let total = result.length / 20;
            let allLoans = [];

            for (let i = 0; i < total; i++) {
              let id = parseInt(result[(i * 20) + 19], 16);
              let loanBytes = result.slice(i * 20, i * 20 + 20);
              allLoans.push(new Loan(
                  id,
                  parseInt(loanBytes[14], 16),
                  loanBytes[2],
                  loanBytes[2],
                  parseInt(loanBytes[5], 16),
                  parseInt(loanBytes[12], 16),
                  parseInt(loanBytes[9], 16),
                  parseInt(loanBytes[10], 16)
              ))
            }

            resolve(allLoans);
          });
        }) as Promise<Loan[]>;
    }
}