import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LoadingController } from '@ionic/angular';

import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';

import firebase from 'firebase/app';
import 'firebase/auth';
import * as bcrypt from 'bcryptjs';
const salt = bcrypt.genSaltSync(10);

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {

  validPattern = /^[a-z0-9]+$/i
  // polyRegx = /[+-]?\d*(x|y)(\^\d)*((y|x)(\^\d)*)*|[+-\s]\d+/g
  loginForm: FormGroup;
  result: any;
  successMsg: String = ""
  errorMsg: String = ""
  derivativeValue:String = ""

  constructor(
    private _router: Router,
    private formBuilder: FormBuilder,
    private loadingController: LoadingController,
    private _authFire: AngularFireAuth,
    private _firestore: AngularFirestore
  ) { }

  ngOnInit() {
    window.scrollTo(0, 0)

    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.pattern(this.validPattern)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      ploy: ['', Validators.required]
    }, { validator: this.checkPolu("ploy") });
  }

  checkPolu(ploy: string) {
    return (group: FormGroup) => {
      let ploya = group.controls[ploy];
      

      if (ploya.value.match(/^\d{0,}(?:[a-z](?:\^\d+)?)?(?: [+-] \d{0,}(?:[a-z](?:\^\d+)?)?)*$/g)) {
        console.log(ploya.value)
        return;
      } else {
        // this.errorMsg = "Password does not match."
        ploya.setErrors({
          notAPoly: true
        })
      }

    }
  }

  get f() { return this.loginForm.controls; }

  loading: any = this.loadingController.create({
    cssClass: 'my-custom-class',
    message: 'Please wait...',
    duration: 0,
    spinner: 'lines'
  });
  async presentLoading() {
    this.loading = await this.loadingController.create({
      cssClass: 'my-custom-class',
      message: 'Please wait...',
      duration: 0,
      spinner: 'lines'
    });
    await this.loading.present();

    const { role, data } = await this.loading.onDidDismiss();
    console.log('Loading dismissed!');
  }

  async dismissLoading() {
    if (this.loading) {
      await this.loading.dismiss();
    }
  }

  async onSubmit() {
    console.log(this.loginForm.value);
    this.presentLoading()

    firebase
    .auth()
    .createUserWithEmailAndPassword(this.loginForm.value.username + '@gmail.com', this.loginForm.value.password)
    .then((response) => {
      console.log(response)
      this._firestore.collection('users').doc(response.user.uid).set({
        userName: this.loginForm.value.username,
        password: bcrypt.hashSync(this.loginForm.value.password, salt),
        polynomial: this.loginForm.value.ploy,
        derivative: this.derivativeVal(this.loginForm.value.ploy, 2)
      }).then(resp => {
        this.successMsg = "Successfully Calculated Derivative "
        this.dismissLoading()
        this.derivativeValue = this.derivativeVal(this.loginForm.value.ploy, 2).toString()
      })
    }).catch((error) =>{
      console.log(error);
      this.dismissLoading()
      this.errorMsg = error.message;
    })

    console.log(this.derivativeVal(this.loginForm.value.ploy, 2))

  }


  derivativeTerm(pTerm, val) {

    // Get coefficient

    let coeffStr = "";

    let i;

    for (i = 0; pTerm[i] != 'x'; i++) {

      if (pTerm[i] == ' ')

        continue;

      coeffStr += (pTerm[i]);

    }



    let coeff = parseInt(coeffStr);



    // Get Power (Skip 2 characters for x and ^)

    let powStr = "";

    for (i = i + 2; i != pTerm.length && pTerm[i] != ' '; i++) {

      powStr += pTerm[i];

    }



    let power = parseInt(powStr);



    // For ax^n, we return a(n-1)x^(n-1)

    return coeff * power * Math.pow(val, power - 1);
  }


  derivativeVal(poly, val) {

    let ans = 0;



    let i = 0;

    let stSplit = poly.split("+");

    while (i < stSplit.length) {

      ans = (ans + this.derivativeTerm(stSplit[i], val));

      i++;

    }

    return ans;
  }

}
