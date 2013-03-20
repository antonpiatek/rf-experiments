use strict;
use warnings;
package RF::Decoder::Debug;

use base 'RF::Decoder::Base';

sub recognize {
  my ($self, $value, $index) = @_;
  print $value, ", ";
}

1;
