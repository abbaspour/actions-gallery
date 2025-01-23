
# Sample 1

## Header:
`uuid=f09d7948-8ac5-4fe1-a77b-9a699fce5256;requestid=3b7d826;status=2;score=80;general=do:MacOS 10.15|di:49fe98f3b7a0da49acbd72af273166ad81765bb2|db:Firefox 134|nd:true|aci:1|dac_1h:1|dic_1h:1|dcc_1h:1|dac_1d:1|dgc_1h:1|dcc_1d:1|dbc_1d:1|dgc_1d:1|dbc_1h:1|idc_1h:1|dic_1d:1|iuc_1h:4|duc_1d:2|idc_1d:1|iuc_1d:2|duc_1h:4;risk=aci:true/H|unp:394089/M|ugp:AU/L|vpn:true/H|due:true/H|prx:true/H|udfp:db7e34379100f9ad4bb127c2d1587adb77c8cfe3/M|iue:true/H;trust=;allow=0;action=monitor`

## Parsed 
```json
{
  uuid: 'f09d7948-8ac5-4fe1-a77b-9a699fce5256',
  requestid: '3b7d826',
  status: '2',
  score: '80',
  general: {
    do: 'MacOS 10.15',
    di: '49fe98f3b7a0da49acbd72af273166ad81765bb2',
    db: 'Firefox 134',
    nd: 'true',
    aci: '1',
    dac_1h: '1',
    dic_1h: '1',
    dcc_1h: '1',
    dac_1d: '1',
    dgc_1h: '1',
    dcc_1d: '1',
    dbc_1d: '1',
    dgc_1d: '1',
    dbc_1h: '1',
    idc_1h: '1',
    dic_1d: '1',
    iuc_1h: '4',
    duc_1d: '2',
    idc_1d: '1',
    iuc_1d: '2',
    duc_1h: '4'
  },
  risk: {
    aci: 'true/H',
    unp: '394089/M',
    ugp: 'AU/L',
    vpn: 'true/H',
    due: 'true/H',
    prx: 'true/H',
    udfp: 'db7e34379100f9ad4bb127c2d1587adb77c8cfe3/M',
    iue: 'true/H'
  },
  'trust=': null,
  allow: '0',
  action: 'monitor'
}
```

# Sample 2

## Header:
`uuid=2c9cfbf4-2dbe-4d0d-b6dc-8a830179ca4e;requestid=3e735c1;status=2;score=30;general=do:MacOS 10.15|di:49fe98f3b7a0da49acbd72af273166ad81765bb2|db:Firefox 134|nd:true|aci:1;risk=unp:394089/M|ugp:AU/L|udfp:4a334a3803096bea9d9441b502257ab0353a5dac/M;trust=;allow=0;action=monitor`

## Parsed 
```json
{
  uuid: '2c9cfbf4-2dbe-4d0d-b6dc-8a830179ca4e',
  requestid: '3e735c1',
  status: '2',
  score: '30',
  general: {
    do: 'MacOS 10.15',
    di: '49fe98f3b7a0da49acbd72af273166ad81765bb2',
    db: 'Firefox 134',
    nd: 'true',
    aci: '1'
  },
  risk: {
    unp: '394089/M',
    ugp: 'AU/L',
    udfp: '4a334a3803096bea9d9441b502257ab0353a5dac/M'
  },
  'trust=': null,
  allow: '0',
  action: 'monitor'
}
```


