export const getAgencyLogo = (domain: string): string | null => {
  return (
    AGENCY_DOMAIN_LOGO_MAP.find((agency) => agency.domain.includes(domain))
      ?.logo || null
  )
}

const AGENCY_DOMAIN_LOGO_MAP = [
  {
    domain: ['mnd.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/mnd.jpg',
  },
  {
    domain: ['smc.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/smc.png',
  },
  {
    domain: [
      'tech.gov.sg',
      'data.gov.sg',
      'form.sg',
      'thedigitalacademy.tech.gov.sg',
      'tech.litemail.gov.sg',
      'hive.gov.sg',
      'support.gov.sg',
      'admin.gov.sg',
      'life.gov.sg',
    ],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/govtech.jpg',
  },
  {
    domain: ['ava.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/ava.jpg',
  },
  {
    domain: ['psd.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/psd.jpg',
  },
  {
    domain: ['ssg.gov.sg', 'ial.edu.sg', 'cpe.gov.sg', 'ssg-wsg.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/ssgwsg.jpg',
  },
  {
    domain: ['mom.gov.sg', 'iac.gov.sg', 'mom.litemail.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/mom.png',
  },
  {
    domain: ['msf.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/msf.png',
  },
  {
    domain: ['pa.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/pa.jpg',
  },
  {
    domain: ['hdb.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/hdb.png',
  },
  {
    domain: ['mfa.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/mfa.jpg',
  },
  {
    domain: ['customs.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/customs.png',
  },
  {
    domain: ['moe.gov.sg', 'moe.edu.sg', 'schools.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/moe.png',
  },
  {
    domain: ['ttsh.com.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/ttsh.jpg',
  },
  {
    domain: ['nea.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/nea.jpg',
  },
  {
    domain: ['mci.gov.sg', 'reach.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/mci.jpg',
  },
  {
    domain: ['mccy.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/mccy.jpg',
  },
  {
    domain: ['defence.gov.sg', 'mindef.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/mindef.png',
  },
  {
    domain: ['mof.gov.sg', 'vital.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/mof.jpg',
  },
  {
    domain: ['moh.gov.sg', 'moht.com.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/moh.png',
  },
  {
    domain: ['mha.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/mha_new.jpg',
  },
  {
    domain: ['mlaw.gov.sg', 'lab.gov.sg', 'sentencingpanel.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/mlaw.jpg',
  },
  {
    domain: ['mewr.gov.sg', 'mse.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/MSE+logo.jpg',
  },
  {
    domain: ['mti.gov.sg'],
    logo: 'https://s3.ap-southeast-1.amazonaws.com/agency-logo.form.sg/mti.jpg',
  },
  {
    domain: ['mot.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/mot.jpg',
  },
  {
    domain: ['pmo.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/pmo.png',
  },
  {
    domain: ['acra.gov.sg'],
    logo: 'https://s3.ap-southeast-1.amazonaws.com/agency-logo.form.sg/acra.png',
  },
  {
    domain: [
      'a-star.edu.sg',
      'isce2.a-star.edu.sg',
      'hq.a-star.edu.sg',
      'acrc.a-star.edu.sg',
      'sics.a-star.edu.sg',
      'bmsi.a-star.edu.sg',
      'amc.a-star.edu.sg',
      'sris.a-star.edu.sg',
      'brc.a-star.edu.sg',
      'artc.a-star.edu.sg',
      'tlgm.a-star.edu.sg',
      'circ.a-star.edu.sg',
      'dsi.a-star.edu.sg',
      'p53lab.a-star.edu.sg',
      'd3.a-star.edu.sg',
      'i2r.a-star.edu.sg',
      'rsc.a-star.edu.sg',
      'etc.a-star.edu.sg',
      'ihpc.a-star.edu.sg',
      'sbic.a-star.edu.sg',
      'hnl.a-star.edu.sg',
      'ime.a-star.edu.sg',
      'mel.a-star.edu.sg',
      'etpl.sg',
      'imre.a-star.edu.sg',
      'jrl.a-star.edu.sg',
      'idg.a-star.edu.sg',
      'merl.a-star.edu.sg',
      'scei.a-star.edu.sg',
      'imb.a-star.edu.sg',
      'nmc.a-star.edu.sg',
      'bii.a-star.edu.sg',
      'immunol.a-star.edu.sg',
      'simtech.a-star.edu.sg',
      'bti.a-star.edu.sg',
      'ices.a-star.edu.sg',
      'ibn.a-star.edu.sg',
      'epgc.a-star.edu.sg',
      'imcb.a-star.edu.sg',
      'gis.a-star.edu.sg',
      'biotrans.a-star.edu.sg',
      'ebc.a-star.edu.sg',
      'nbl.a-star.edu.sg',
      'eddc.a-star.edu.sg',
      'nscc.a-star.edu.sg',
      'sifbi.a-star.edu.sg',
      'i3.a-star.edu.sg',
      'idlabs.a-star.edu.sg',
      'asrl.a-star.edu.sg',
      'aero.a-star.edu.sg',
    ],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/astar-v2.png',
  },
  {
    domain: ['aic.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/aic.png',
  },
  {
    domain: ['bca.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/bca.png',
  },
  {
    domain: ['gra.gov.sg'],
    logo: 'https://s3.ap-southeast-1.amazonaws.com/agency-logo.form.sg/gra.jpg',
  },
  {
    domain: ['cpf.gov.sg', 'careshieldlife.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/cpfb.png',
  },
  {
    domain: ['caas.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/caas.jpg',
  },
  {
    domain: ['cscollege.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/cscollege.png',
  },
  {
    domain: ['sportsschool.edu.sg'],
    logo: 'https://s3.ap-southeast-1.amazonaws.com/agency-logo.form.sg/sss.jpg',
  },
  {
    domain: ['cea.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/cea.png',
  },
  {
    domain: ['dsta.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/dsta.gif',
  },
  {
    domain: ['edb.gov.sg', 'designsingapore.org'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/edb.png',
  },
  {
    domain: ['ema.gov.sg'],
    logo: 'https://s3.ap-southeast-1.amazonaws.com/agency-logo.form.sg/ema2.jpg',
  },
  {
    domain: ['hpb.gov.sg', 'sch.hpb.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/hpb.jpg',
  },
  {
    domain: ['hsa.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/hsa.jpg',
  },
  {
    domain: ['imda.gov.sg', 'sdo.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/imda.jpg',
  },
  {
    domain: ['iras.gov.sg'],
    logo: 'https://s3.ap-southeast-1.amazonaws.com/agency-logo.form.sg/iras.png',
  },
  {
    domain: ['ite.gov.sg', 'ite.edu.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/ite.jpg',
  },
  {
    domain: ['ipos.gov.sg', 'iposinternational.com'],
    logo: 'https://s3.ap-southeast-1.amazonaws.com/agency-logo.form.sg/ipos-new.png',
  },
  {
    domain: ['iesingapore.gov.sg', 'enterprisesg.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/enterprisesg.png',
  },
  {
    domain: ['iseas.edu.sg', 'iseas.gov.sg'],
    logo: 'https://s3.ap-southeast-1.amazonaws.com/agency-logo.form.sg/iseas2.jpg',
  },
  {
    domain: ['jtc.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/jtc.png',
  },
  {
    domain: ['lta.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/lta.png',
  },
  {
    domain: ['muis.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/muis.jpg',
  },
  {
    domain: ['mpa.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/mpa.png',
  },
  {
    domain: ['mas.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/mas.png',
  },
  {
    domain: ['nyp.edu.sg', 'sirs.edu.sg', 'aci.edu.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/nyp.jpg',
  },
  {
    domain: ['nac.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/nac.png',
  },
  {
    domain: ['ncss.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/ncss.gif',
  },
  {
    domain: ['nlb.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/nlb.jpg',
  },
  {
    domain: ['nparks.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/nparks.gif',
  },
  {
    domain: ['np.edu.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/np.jpg',
  },
  {
    domain: ['pub.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/pub.jpg',
  },
  {
    domain: ['ptc.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/ptc.jpg',
  },
  {
    domain: ['rp.edu.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/rp.jpg',
  },
  {
    domain: ['science.edu.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/science.png',
  },
  {
    domain: ['sentosa.gov.sg', 'sentosa.com.sg'],
    logo: 'https://s3.ap-southeast-1.amazonaws.com/agency-logo.form.sg/sentosa+v4.png',
  },
  {
    domain: ['sac.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/sac.png',
  },
  {
    domain: ['score.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/score.jpg',
  },
  {
    domain: ['seab.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/seab.gif',
  },
  {
    domain: ['slf.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/slf.png',
  },
  {
    domain: ['sla.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/sla.jpg',
  },
  {
    domain: ['snb.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/snb.jpg',
  },
  {
    domain: ['spc.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/spc.png',
  },
  {
    domain: ['sp.edu.sg'],
    logo: 'https://s3.ap-southeast-1.amazonaws.com/agency-logo.form.sg/sp_new.png',
  },
  {
    domain: ['stb.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/stb.jpg',
  },
  {
    domain: ['sport.gov.sg', 'sport.litemail.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/sportsg.jpg',
  },
  {
    domain: ['spring.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/spring.jpg',
  },
  {
    domain: ['tp.edu.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/tp.jpg',
  },
  {
    domain: ['toteboard.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/toteboard.jpg',
  },
  {
    domain: ['ura.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/ura.jpg',
  },
  {
    domain: ['agc.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/agc.gif',
  },
  {
    domain: ['ago.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/ago.png',
  },
  {
    domain: ['istana.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/istana.gif',
  },
  {
    domain: ['fjcourts.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/fjcourts.jpg',
  },
  {
    domain: ['statecourts.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/statecourts.jpeg',
  },
  {
    domain: ['supcourt.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/supcourt.gif',
  },
  {
    domain: ['parl.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/parl.gif',
  },
  {
    domain: ['psc.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/psc.JPG',
  },
  {
    domain: ['cabinet.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/co.jpg',
  },
  {
    domain: ['cpib.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/cpib.png',
  },
  {
    domain: ['csa.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/csa.jpg',
  },
  {
    domain: ['nuhs.edu.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/nuhs+logo.png',
  },
  {
    domain: ['nyc.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/nyc.jpg',
  },
  {
    domain: ['wh.com.sg'],
    logo: 'https://s3.ap-southeast-1.amazonaws.com/agency-logo.form.sg/Wh.com.sg',
  },
  {
    domain: [
      'nhg.com.sg',
      'diagnostics.nhg.com.sg',
      'pharmacy.nhg.com.sg',
      'nhgp.com.sg',
      'nsc.com.sg',
      'imh.com.sg',
      'pca.sg',
      'geri.com.sg',
    ],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/nhg.jpg',
  },
  {
    domain: ['ktph.com.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/ktph-v2.png',
  },
  {
    domain: ['singstat.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/singstat.png',
  },
  {
    domain: ['eld.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/eld.png',
  },
  {
    domain: [
      'singhealth.com.sg',
      'ndcs.com.sg',
      'nhcs.com.sg',
      'nccs.com.sg',
      'nni.com.sg',
      'skh.com.sg',
      'sgh.com.sg',
      'snec.com.sg',
      'singhealthch.com.sg',
      'seri.com.sg',
    ],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/singhealth.jpeg',
  },
  {
    domain: ['spf.gov.sg', 'jom.org.sg', 'lkm.org.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/spf_new.png',
  },
  {
    domain: ['sps.gov.sg', 'pris.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/sps.jpg',
  },
  {
    domain: ['scdf.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/scdf.png',
  },
  {
    domain: ['nscs.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/nscs.jpg',
  },
  {
    domain: ['ica.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/ica-new.png',
  },
  {
    domain: ['nhb.gov.sg'],
    logo: 'https://s3.ap-southeast-1.amazonaws.com/agency-logo.form.sg/nhb_new.jpg',
  },
  {
    domain: ['nrf.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/nrf.png',
  },
  {
    domain: ['ecda.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/ecda.png',
  },
  {
    domain: ['pdpc.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/pdpc.png',
  },
  {
    domain: ['highsch.nus.edu.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/nhs.jpg',
  },
  {
    domain: ['cnb.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/cnb.png',
  },
  {
    domain: ['agd.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/agd.png',
  },
  {
    domain: ['dentalcouncil.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/sdc.png',
  },
  {
    domain: ['cgh.com.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/cgh.png',
  },
  {
    domain: ['nysi.org.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/nysi.jpg',
  },
  {
    domain: ['sfa.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/sfa.png',
  },
  {
    domain: ['cccs.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/cccs.jpg',
  },
  {
    domain: ['nie.edu.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/nie.png',
  },
  {
    domain: ['tcmpb.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/TCMP+Logo.JPG',
  },
  {
    domain: ['edbi.com'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/edbi.png',
  },
  {
    domain: ['ihis.com.sg', 'synapxe.sg'],
    logo: 'https://s3.ap-southeast-1.amazonaws.com/agency-logo.form.sg/synapxe.png',
  },
  {
    domain: ['kkh.com.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/kkh.png',
  },
  {
    domain: ['ncpc.org.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/ncpc.png',
  },
  {
    domain: [
      'open.gov.sg',
      'isomer.gov.sg',
      'form.gov.sg',
      'pay.gov.sg',
      'vault.gov.sg',
    ],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/ogp.png',
  },
  {
    domain: ['notu.com.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/notu.png',
  },
  {
    domain: ['sgh.com.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/sgh.png',
  },
  {
    domain: ['sota.edu.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/sota.jpg',
  },
  {
    domain: ['mohh.com.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/mohh.jpg',
  },
  {
    domain: ['csit.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/csit.png',
  },
  {
    domain: ['spb.gov.sg'],
    logo: 'https://s3.ap-southeast-1.amazonaws.com/agency-logo.form.sg/spb.png',
  },
  {
    domain: [],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/ams.jpg',
  },
  {
    domain: ['htx.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/htx.jpg',
  },
  {
    domain: ['boa.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/boa.jpg',
  },
  {
    domain: ['alpshealthcare.com.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/alps.png',
  },
  {
    domain: ['scbb.com.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/scbb.jpg',
  },
  {
    domain: ['sinda.org.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/sinda.jpg',
  },
  {
    domain: ['vanguardhealthcare.com.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/vanguard.jpg',
  },
  {
    domain: ['sgenable.sg'],
    logo: 'https://s3.ap-southeast-1.amazonaws.com/agency-logo.form.sg/sgenable2.png',
  },
  {
    domain: ['wshi.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/wshi.png',
  },
  {
    domain: ['mendaki.org.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/mendaki.jpg',
  },
  {
    domain: [],
    logo: 'https://s3.ap-southeast-1.amazonaws.com/agency-logo.form.sg/nysi.jpg',
  },
  {
    domain: ['yellowribbon.gov.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/yrsg.jpg',
  },
  {
    domain: ['yishunhospital.com.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/ych-logo-1.png',
  },
  {
    domain: ['ncid.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/ncid-logo-1.png',
  },
  {
    domain: ['1fss.com.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/1fss.png',
  },
  {
    domain: ['singhealthacademy.edu.sg'],
    logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/singhealth+academy.png',
  },
  {
    domain: ['lsc.gov.sg'],
    logo: 'https://s3.ap-southeast-1.amazonaws.com/agency-logo.form.sg/lsc+logo.png',
  },
  {
    domain: ['ibb.a-star.edu.sg'],
    logo: 'https://s3.ap-southeast-1.amazonaws.com/agency-logo.form.sg/ibb.jpg',
  },
  {
    domain: ['kidstart.sg'],
    logo: 'https://s3.ap-southeast-1.amazonaws.com/agency-logo.form.sg/kidstart.png',
  },
  {
    domain: ['cris.sg'],
    logo: 'https://s3.ap-southeast-1.amazonaws.com/agency-logo.form.sg/CRIS.png',
  },
  {
    domain: ['actris.cris.sg'],
    logo: 'https://s3.ap-southeast-1.amazonaws.com/agency-logo.form.sg/ACTRIS.png',
  },
  {
    domain: ['nhic.cris.sg'],
    logo: 'https://s3.ap-southeast-1.amazonaws.com/agency-logo.form.sg/NHIC.png',
  },
  {
    domain: ['precise.cris.sg'],
    logo: 'https://s3.ap-southeast-1.amazonaws.com/agency-logo.form.sg/PRECISE.png',
  },
  {
    domain: ['scri.cris.sg'],
    logo: 'https://s3.ap-southeast-1.amazonaws.com/agency-logo.form.sg/SCRI.png',
  },
  {
    domain: ['stcc.cris.sg'],
    logo: 'https://s3.ap-southeast-1.amazonaws.com/agency-logo.form.sg/STCC.png',
  },
  {
    domain: ['hta.gov.sg'],
    logo: 'https://s3.ap-southeast-1.amazonaws.com/agency-logo.form.sg/hta2023.png',
  },
  {
    domain: ['wsg.gov.sg'],
    logo: 'https://s3.ap-southeast-1.amazonaws.com/agency-logo.form.sg/wsg.png',
  },
  {
    domain: ['peb.gov.sg'],
    logo: 'https://s3.ap-southeast-1.amazonaws.com/agency-logo.form.sg/peb.jpg',
  },
  {
    domain: [
      'judiciary.gov.sg',
      'statecourts.gov.sg',
      'fjcourts.gov.sg',
      'supcourt.gov.sg',
    ],
    logo: 'https://s3.ap-southeast-1.amazonaws.com/agency-logo.form.sg/judiciary.png',
  },
  {
    domain: ['nationalgallery.sg'],
    logo: 'https://s3.ap-southeast-1.amazonaws.com/agency-logo.form.sg/nationalgallery',
  },
  {
    domain: ['sso.org.sg'],
    logo: 'https://s3.ap-southeast-1.amazonaws.com/agency-logo.form.sg/sso.png',
  },
  {
    domain: [],
    logo: 'https://s3.ap-southeast-1.amazonaws.com/agency-logo.form.sg/sso.png',
  },
  {
    domain: ['hlb.gov.sg'],
    logo: 'https://s3.ap-southeast-1.amazonaws.com/agency-logo.form.sg/hlb.PNG',
  },
  {
    domain: ['jsc.gov.sg'],
    logo: 'https://s3.ap-southeast-1.amazonaws.com/agency-logo.form.sg/jsc.png',
  },
]
