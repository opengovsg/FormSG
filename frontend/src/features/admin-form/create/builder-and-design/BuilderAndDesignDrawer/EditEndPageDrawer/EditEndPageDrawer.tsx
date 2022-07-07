import { BuilderDrawerContainer } from '../common/BuilderDrawerContainer'
import { EditEndPage } from '../EditEndPageDrawer/EditEndPage'

export const EditEndPageDrawer = (): JSX.Element | null => (
  <BuilderDrawerContainer title="Thank You">
    <EditEndPage />
  </BuilderDrawerContainer>
)
